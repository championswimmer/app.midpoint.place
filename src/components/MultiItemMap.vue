<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { loadGoogleMapsScript } from '@/services/mapService';
import type { UserLocation } from '@/services/apiService';
import type { GroupPlaceResponse, PlaceType } from '@/services/apiService';

// SVG imports for markers
import mapPinDefaultSvg from '@/assets/map-pin.svg?raw';
import mapPinCafeSvg from '@/assets/map-pin-cafe.svg?raw';
import mapPinBarSvg from '@/assets/map-pin-bar.svg?raw';
import mapPinRestaurantSvg from '@/assets/map-pin-restaurant.svg?raw';
import mapPinParkSvg from '@/assets/map-pin-park.svg?raw';

// Define interfaces for props
interface MapItem {
  id: string | number;
  location: UserLocation;
  name?: string; // Optional name for info window or tooltip
}

// Interface for place items, extending relevant fields from GroupPlaceResponse
// and ensuring compatibility with MapItem structure.
interface PlaceItem extends Omit<GroupPlaceResponse, 'group_id' | 'latitude' | 'longitude' | 'type'> {
  // id is inherited from GroupPlaceResponse (string) and satisfies MapItem's id (string | number).
  // name is inherited from GroupPlaceResponse (string) and satisfies MapItem's optional name (string).
  location: UserLocation; // Explicitly define to match MapItem and provide clear structure.
  type: PlaceType; // Explicitly define type to use the imported PlaceType and satisfy linter.
  // Other fields like address, map_uri, place_id, rating are inherited from GroupPlaceResponse.
}

interface UserItem extends MapItem {
  username: string;
}

const props = defineProps<{
  users: UserItem[];
  places: PlaceItem[];
  midpoint: UserLocation | null;
}>();

const emit = defineEmits<{
  (e: 'map-load-error', message: string): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<google.maps.Map | null>(null);
const markers = shallowRef<google.maps.Marker[]>([]);
const openInfoWindow = shallowRef<google.maps.InfoWindow | null>(null);

const DEFAULT_ZOOM = 14;

const placeIconMap: Record<string, string> = {
  cafe: mapPinCafeSvg,
  bar: mapPinBarSvg,
  restaurant: mapPinRestaurantSvg,
  park: mapPinParkSvg,
  default: mapPinDefaultSvg, // Fallback for unknown place types
};

const getIconForPlace = (type: string): string => {
  return placeIconMap[type] || placeIconMap.default;
};

const createMarker = (
  position: UserLocation,
  iconSvg: string,
  title?: string,
  infoWindowContent?: string
): google.maps.Marker | null => {
  if (!map.value) return null;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
    scaledSize: new google.maps.Size(36, 36), // Adjust size as needed
    anchor: new google.maps.Point(18, 36), // Adjust anchor based on icon shape (bottom center)
  };

  const marker = new google.maps.Marker({
    position: { lat: position.latitude, lng: position.longitude },
    map: map.value,
    icon: icon,
    title: title,
  });

  if (infoWindowContent && map.value) {
    const infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });

    marker.addListener('click', () => {
      if (openInfoWindow.value) {
        openInfoWindow.value.close();
      }
      infoWindow.open(map.value, marker);
      openInfoWindow.value = infoWindow;
    });
  }

  return marker;
};

const clearMarkers = () => {
  if (openInfoWindow.value) {
    openInfoWindow.value.close();
    openInfoWindow.value = null;
  }
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];
};

const updateMarkers = () => {
  if (!map.value) return;
  clearMarkers();

  const newMarkers: google.maps.Marker[] = [];

  // User markers
  props.users.forEach(user => {
    if (user.location) {
      const marker = createMarker(user.location, mapPinDefaultSvg, user.username);
      if (marker) newMarkers.push(marker);
    }
  });

  // Place markers
  props.places.forEach(place => {
    if (place.location) {
      const iconSvg = getIconForPlace(place.type as string);
      let infoContent = `<h5>${place.name}</h5>`;
      // infoContent += `<br>(${place.type})`;
      infoContent += `<br><b>Address:</b> ${place.address}`;
      if (place.rating) {
        infoContent += `<br> ⭐ ${place.rating} / 5`;
      }
      if (place.map_uri) {
        infoContent += `<br><a href="${place.map_uri}" target="_blank">Open in Google Maps</a>`;
      }
      // Add other details from GroupPlaceResponse as needed
      // e.g. place.place_id etc.

      const marker = createMarker(place.location, iconSvg, place.name, infoContent);
      if (marker) newMarkers.push(marker);
    }
  });

  // Midpoint marker
  if (props.midpoint) {
    const marker = createMarker(props.midpoint, mapPinDefaultSvg, 'Midpoint');
    if (marker) newMarkers.push(marker);
  }

  markers.value = newMarkers;
};


const loadMap = async () => {
  try {
    await loadGoogleMapsScript();
    if (mapContainer.value && window.google && window.google.maps) {
      const initialCenter = props.midpoint
        ? { lat: props.midpoint.latitude, lng: props.midpoint.longitude }
        : { lat: 37.0902, lng: -95.7129 }; // Default to center of US if no midpoint

      map.value = new window.google.maps.Map(mapContainer.value, {
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        scrollwheel: true,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }],
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Cast the entire options object to any

      updateMarkers(); // Initial marker placement

    } else {
      emit('map-load-error', 'Google Maps script loaded but API not available.');
    }
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    emit('map-load-error', 'Could not load Google Maps. Please try again later.');
  }
};

onMounted(() => {
  loadMap();
});

onUnmounted(() => {
  clearMarkers();
  if (openInfoWindow.value) {
    openInfoWindow.value.close();
    openInfoWindow.value = null;
  }
  // Potentially more cleanup if map listeners were added
});

watch(() => [props.users, props.places, props.midpoint], () => {
  if (map.value) {
    updateMarkers();
    // Optionally re-center map if midpoint changes significantly or new items are outside current view
    if (props.midpoint) {
      map.value.panTo({ lat: props.midpoint.latitude, lng: props.midpoint.longitude });
      map.value.setZoom(DEFAULT_ZOOM);
    }
  }
}, { deep: true });

</script>

<style scoped>
.map-container {
  height: 500px;
  /* Adjust as needed */
  width: 100%;
}
</style>
