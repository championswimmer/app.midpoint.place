<template>
  <BModal v-model="isModalVisible" title="Update Your Location" size="lg" hide-footer @hidden="onModalHidden">
    <div class="modal-body-content">
      <p>Please select your location on the map.</p>

      <div class="d-flex mb-2">
        <BButton variant="outline-primary" @click="triggerPanToBrowserLocation" size="sm">
          <LocateFixed :size="18" class="me-1" />
          Locate Me
        </BButton>
      </div>

      <LocationPickerMap ref="locationPickerMapRef" :initial-location="authStore.user?.location"
        @update:location="handleLocationUpdateFromMap" @map-load-error="handleMapLoadError" class="mb-3" />

      <div v-if="currentLatLng" class="mb-3 fw-light">
        <small>Selected Location:
          <span class="font-monospace">
            {{ currentLatLng.latitude.toFixed(6) }}, {{ currentLatLng.longitude.toFixed(6) }}
          </span>
        </small>
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
import { ref, computed, watch } from 'vue'
import { BModal, BButton } from 'bootstrap-vue-next'
import { useLocationStore } from '@/stores/locationStore'
import { useAuthStore } from '@/stores/auth'
import { useErrorStore } from '@/stores/error'
import apiService from '@/services/apiService'
import type { User, UserLocation } from '@/services/apiService'
import { LocateFixed } from 'lucide-vue-next'
import LocationPickerMap from '@/components/LocationPickerMap.vue'

const locationStore = useLocationStore()
const authStore = useAuthStore()
const errorStore = useErrorStore()

const isModalVisible = computed({
  get: () => locationStore.isLocationUpdateModalVisible,
  set: (value) => {
    if (!value) {
      locationStore.closeLocationUpdateModal()
    }
  }
})

const locationPickerMapRef = ref<InstanceType<typeof LocationPickerMap> | null>(null)
const currentLatLng = ref<UserLocation | null>(authStore.user?.location || null)
const isLoading = ref(false)
const geolocationError = ref<string | null>(null)

const triggerPanToBrowserLocation = async () => {
  geolocationError.value = null // Clear previous errors
  if (locationPickerMapRef.value) {
    const newLocation = await locationPickerMapRef.value.panToBrowserLocation()
    if (newLocation) {
      // currentLatLng will be updated by the map component's emit event
    } else {
      // Error messages are handled by the map component via emits
    }
  }
}

const handleLocationUpdateFromMap = (location: UserLocation | null) => {
  currentLatLng.value = location
}

const handleMapLoadError = (message: string) => {
  geolocationError.value = message
}

const closeModal = () => {
  locationStore.closeLocationUpdateModal()
}

const onModalHidden = () => {
  // currentLatLng is reset when modal opens based on authStore.user.location or to null
  geolocationError.value = null
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
    errorStore.setError('Failed to update location. Please try again.')
  } finally {
    isLoading.value = false
  }
}

watch(() => locationStore.isLocationUpdateModalVisible, (newValue) => {
  if (newValue) {
    // Reset currentLatLng based on user's stored location when modal opens
    currentLatLng.value = authStore.user?.location || null;
    geolocationError.value = null;
    // If user has no location, attempt to pan to browser location
    // The map component itself will try to pan if no initial location is provided, so this might be redundant
    // or could be a specific UX choice.
    // For now, let the map component handle its initial pan if no initialLocation is set.
    if (!authStore.user?.location) {
      // Delay to ensure map is loaded before trying to pan
      setTimeout(() => {
        if (isModalVisible.value) { // Check if modal is still visible
          triggerPanToBrowserLocation();
        }
      }, 200); // Adjust delay as needed
    }
  }
})

// No onUnmounted needed here for map listeners as they are in the child component

</script>

<style scoped>
/* Styles from the old component can be removed if not specifically for the modal shell */

.modal-body-content {}
</style>
