<template>
  <BModal v-model="isModalVisible" title="Update Your Location" size="lg" hide-footer @hidden="onModalHidden">
    <div class="modal-body-content">
      <p>Please select your location on the map.</p>

      <div class="d-flex mb-2">
        <BButton variant="outline-primary" @click="panToBrowserLocation" size="sm">
          <LocateFixed :size="18" class="me-1" />
          Locate Me
        </BButton>
      </div>

      <div ref="mapContainer" class="map-container mb-3"></div>
      <div v-if="currentLatLng" class="mb-3 font-monospace">
        <small>Selected Location: {{ currentLatLng.latitude.toFixed(6) }}, {{ currentLatLng.longitude.toFixed(6)
          }}</small>
      </div>
      <div v-if="geolocationError" class="alert alert-warning" role="alert">
        {{ geolocationError }}
      </div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <BButton variant="secondary" @click="closeModal" class="me-2">Cancel</BButton>
      <BButton variant="primary" @click="handleUpdateLocation" :disabled="!currentLatLng || isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Update Location
      </BButton>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { BModal, BButton } from 'bootstrap-vue-next'
import { useLocationStore } from '@/stores/locationStore'
import { useAuthStore } from '@/stores/auth'
import { loadGoogleMapsScript, getBrowserLocation as fetchBrowserLocation } from '@/services/mapService'
import apiService from '@/services/apiService'
import type { User, UserLocation } from '@/services/apiService'
import { LocateFixed } from 'lucide-vue-next';

const locationStore = useLocationStore()
const authStore = useAuthStore()

const isModalVisible = computed({
  get: () => locationStore.isLocationUpdateModalVisible,
  set: (value) => {
    if (!value) {
      locationStore.closeLocationUpdateModal()
    }
  }
})

const mapContainer = ref<HTMLElement | null>(null)
// @ts-expect-error google is a global variable from Google Maps script
const map = ref<google.maps.Map | null>(null)
const currentLatLng = ref<UserLocation | null>(null)
const isLoading = ref(false)
const geolocationError = ref<string | null>(null)
// @ts-expect-error google is a global variable from Google Maps script
let mapIdleListener: google.maps.MapsEventListener | null = null

const DEFAULT_ZOOM = 8
const BROWSER_LOC_ZOOM = 16

const panToBrowserLocation = async () => {
  geolocationError.value = null // Clear previous errors
  const browserLoc = await fetchBrowserLocation()
  if (browserLoc && map.value) {
    map.value.setCenter({ lat: browserLoc.latitude, lng: browserLoc.longitude })
    map.value.setZoom(BROWSER_LOC_ZOOM)
    // currentLatLng will be updated by the map 'idle' event listener, so no need to set it directly here unless immediate feedback is desired before map idle.
    // For consistency, let's allow the idle listener to set currentLatLng.
    // currentLatLng.value = browserLoc;
  } else if (!browserLoc) {
    geolocationError.value = 'Could not get your current location. Please ensure location services are enabled and permission is granted.'
    if (!navigator.geolocation) {
      geolocationError.value = 'Geolocation is not supported by your browser.'
    }
  }
}

const loadMap = async () => {
  try {
    await loadGoogleMapsScript()
    // @ts-expect-error google is a global variable from Google Maps script
    if (mapContainer.value && window.google && window.google.maps) {
      const userLocation = authStore.user?.location
      const initialCenter = userLocation
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : { lat: 37.0902, lng: -95.7129 } // Default to center of US
      const initialZoom = userLocation ? BROWSER_LOC_ZOOM : DEFAULT_ZOOM
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
      centerPin.src = "https://maps.gstatic.com/mapfiles/markers2/marker.png";
      centerPin.style.position = 'absolute';
      centerPin.style.top = '50%';
      centerPin.style.left = '50%';
      centerPin.style.transform = 'translate(-50%, -100%)';
      centerPin.style.pointerEvents = 'none';
      mapContainer.value.appendChild(centerPin);

      mapIdleListener = map.value.addListener('idle', () => {
        const center = map.value?.getCenter()
        if (center) {
          currentLatLng.value = { latitude: center.lat(), longitude: center.lng() }
        }
      })

      // Set initial currentLatLng based on map center after listeners are attached
      const currentMapCenter = map.value?.getCenter()
      if (currentMapCenter) {
        currentLatLng.value = { latitude: currentMapCenter.lat(), longitude: currentMapCenter.lng() }
      }

      if (!userLocation) {
        await panToBrowserLocation() // Use the new method
      }
    }
  } catch (error) {
    console.error('Failed to load Google Maps:', error)
    geolocationError.value = 'Could not load Google Maps. Please try again later.'
  }
}

const closeModal = () => {
  locationStore.closeLocationUpdateModal()
}

const onModalHidden = () => {
  currentLatLng.value = null
  geolocationError.value = null
  if (mapIdleListener) {
    mapIdleListener.remove()
    mapIdleListener = null
  }
  // Consider removing custom controls if map instance persists and modal is reopened
  // For now, assuming map is re-initialized or control is fine to persist or be re-added
}

const handleUpdateLocation = async () => {
  if (!currentLatLng.value || !authStore.user) return

  isLoading.value = true
  try {
    const userToUpdate = { ...authStore.user, location: currentLatLng.value } as User;

    await apiService.updateUser(userToUpdate)
    authStore.updateUserLocation(currentLatLng.value)
    closeModal()
  } catch (error) {
    console.error('Failed to update location:', error)
    geolocationError.value = 'Failed to update location. Please try again.'
  } finally {
    isLoading.value = false
  }
}

watch(() => locationStore.isLocationUpdateModalVisible, (newValue) => {
  if (newValue) {
    // Ensure map container is visible and ready before loading map
    setTimeout(() => {
      loadMap()
    }, 100);
  }
})

onUnmounted(() => {
  if (mapIdleListener) {
    mapIdleListener.remove()
  }
  // Clean up custom controls if necessary, though usually map instance is destroyed with component
})

</script>

<style scoped>
.map-container {
  height: 400px;
  width: 100%;
  position: relative;
}

.modal-body-content {}
</style>
