<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { loadGoogleMapsScript, getBrowserLocation as fetchBrowserLocation } from '@/services/mapService'
import type { UserLocation } from '@/services/apiService'
import mapPinSvg from '@/assets/map-pin.svg?raw'

const props = defineProps<{
  initialLocation?: UserLocation | null
}>()

const emit = defineEmits<{
  (e: 'update:location', location: UserLocation | null): void
  (e: 'map-load-error', message: string): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
// @ts-expect-error google is a global variable from Google Maps script
const map = ref<google.maps.Map | null>(null)
// @ts-expect-error google is a global variable from Google Maps script
let mapIdleListener: google.maps.MapsEventListener | null = null

const DEFAULT_ZOOM = 8
const BROWSER_LOC_ZOOM = 16

const panToBrowserLocation = async (): Promise<UserLocation | null> => {
  const browserLoc = await fetchBrowserLocation()
  if (browserLoc && map.value) {
    map.value.setCenter({ lat: browserLoc.latitude, lng: browserLoc.longitude })
    map.value.setZoom(BROWSER_LOC_ZOOM)
    // The 'idle' event will update the location, returning it here for immediate use if needed.
    return browserLoc
  } else if (!browserLoc) {
    emit('map-load-error', 'Could not get your current location. Please ensure location services are enabled and permission is granted.')
    if (!navigator.geolocation) {
      emit('map-load-error', 'Geolocation is not supported by your browser.')
    }
  }
  return null
}

defineExpose({
  panToBrowserLocation
})

const loadMap = async () => {
  try {
    await loadGoogleMapsScript()
    // @ts-expect-error google is a global variable from Google Maps script
    if (mapContainer.value && window.google && window.google.maps) {
      const initialCenter = props.initialLocation
        ? { lat: props.initialLocation.latitude, lng: props.initialLocation.longitude }
        : { lat: 37.0902, lng: -95.7129 } // Default to center of US
      const initialZoom = props.initialLocation ? BROWSER_LOC_ZOOM : DEFAULT_ZOOM

      // @ts-expect-error google is a global variable from Google Maps script
      map.value = new window.google.maps.Map(mapContainer.value, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        scrollwheel: true,
      })

      const centerPin = document.createElement('img');
      centerPin.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(mapPinSvg)}`;
      centerPin.style.position = 'absolute';
      centerPin.style.top = '50%';
      centerPin.style.left = '50%';
      centerPin.style.width = '48px';
      centerPin.style.height = '48px';
      centerPin.style.transform = 'translate(-50%, -100%)'; // Center horizontally, place bottom of pin at center
      centerPin.style.pointerEvents = 'none'; // So it doesn't interfere with map events
      mapContainer.value.appendChild(centerPin);


      mapIdleListener = map.value.addListener('idle', () => {
        const center = map.value?.getCenter()
        if (center) {
          emit('update:location', { latitude: center.lat(), longitude: center.lng() })
        }
      })

      // Emit initial location
      const currentMapCenter = map.value?.getCenter()
      if (currentMapCenter) {
        emit('update:location', { latitude: currentMapCenter.lat(), longitude: currentMapCenter.lng() })
      }

    }
  } catch (error) {
    console.error('Failed to load Google Maps:', error)
    emit('map-load-error', 'Could not load Google Maps. Please try again later.')
  }
}

onMounted(() => {
  loadMap()
})

onUnmounted(() => {
  if (mapIdleListener) {
    mapIdleListener.remove()
  }
})

watch(() => props.initialLocation, (newLocation) => {
  if (newLocation && map.value) {
    const currentMapCenter = map.value.getCenter();
    if (currentMapCenter?.lat() !== newLocation.latitude || currentMapCenter?.lng() !== newLocation.longitude) {
      map.value.setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
      map.value.setZoom(BROWSER_LOC_ZOOM); // Or a suitable zoom level
    }
  }
}, { immediate: false }) // immediate might be true if you want to pan on first load based on prop

</script>

<style scoped>
.map-container {
  height: 400px;
  width: 100%;
  position: relative;
  /* Required for absolute positioning of the pin */
}
</style>
