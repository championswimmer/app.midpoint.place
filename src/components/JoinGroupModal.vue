<template>
  <BModal v-model="isModalOpen" title="Confirm Your Location to Join Group" size="lg" no-footer @hidden="onModalHidden">
    <div class="modal-body-content">
      <p>Please confirm the location from where you will be travelling to join the group.</p>

      <div class="d-flex mb-2">
        <BButton variant="outline-primary" @click="triggerPanToBrowserLocation" size="sm">
          <LocateFixed :size="18" class="me-1" />
          Use My Current Location
        </BButton>
      </div>

      <LocationPickerMap ref="locationPickerMapRef" :initial-location="authStore.user?.location"
        @update:location="handleLocationUpdateFromMap" @map-load-error="handleMapLoadError" class="mb-3" />

      <div v-if="selectedLocation" class="mb-3 fw-light">
        <small>Selected Location for Joining:
          <span class="font-monospace">
            {{ selectedLocation.latitude.toFixed(6) }}, {{ selectedLocation.longitude.toFixed(6) }}
          </span>
        </small>
      </div>
      <div v-if="mapOrApiError" class="alert alert-warning" role="alert">
        {{ mapOrApiError }}
      </div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <BButton variant="secondary" @click="closeModal" class="me-2">Cancel</BButton>
      <BButton variant="success" @click="confirmJoinGroup" :disabled="!selectedLocation || isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        Confirm and Join Group
      </BButton>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import { useAuthStore } from '@/stores/auth';
import apiService, { type UserLocation, type GroupUserJoinRequest } from '@/services/apiService';
import { LocateFixed } from 'lucide-vue-next';
import LocationPickerMap from '@/components/LocationPickerMap.vue';

const props = defineProps<{
  isVisible: boolean;
  groupCode: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:isVisible', value: boolean): void;
  (e: 'join-successful'): void;
}>();

const authStore = useAuthStore();

const locationPickerMapRef = ref<InstanceType<typeof LocationPickerMap> | null>(null);
const selectedLocation = ref<UserLocation | null>(authStore.user?.location || null);
const isLoading = ref(false);
const mapOrApiError = ref<string | null>(null);

const isModalOpen = computed({
  get: () => props.isVisible,
  set: (value) => emit('update:isVisible', value),
});

const triggerPanToBrowserLocation = async () => {
  mapOrApiError.value = null; // Clear previous errors
  if (locationPickerMapRef.value) {
    const newLocation = await locationPickerMapRef.value.panToBrowserLocation();
    if (newLocation) {
      // selectedLocation will be updated by the map component's emit event
    }
    // Error messages from panToBrowserLocation are handled by handleMapLoadError via emit
  }
};

const handleLocationUpdateFromMap = (location: UserLocation | null) => {
  selectedLocation.value = location;
  mapOrApiError.value = null; // Clear map-related errors if user manually selects a location
};

const handleMapLoadError = (message: string) => {
  mapOrApiError.value = message;
};

const closeModal = () => {
  emit('update:isVisible', false);
};

const onModalHidden = () => {
  mapOrApiError.value = null;
  // Reset selectedLocation to user's default when modal is fully closed,
  // so it's fresh if reopened.
  selectedLocation.value = authStore.user?.location || null;
};

const confirmJoinGroup = async () => {
  if (!selectedLocation.value || !props.groupCode) {
    mapOrApiError.value = 'Selected location or group code is missing.';
    return;
  }

  isLoading.value = true;
  mapOrApiError.value = null;
  try {
    const joinData: GroupUserJoinRequest = {
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude,
    };
    await apiService.joinGroup(props.groupCode, joinData);
    emit('join-successful');
    closeModal();
  } catch (err) {
    console.error('Failed to join group:', err);
    const errorResponse = err as { response?: { data?: { detail?: string } } };
    if (errorResponse.response && errorResponse.response.data && errorResponse.response.data.detail) {
      mapOrApiError.value = errorResponse.response.data.detail;
    } else {
      mapOrApiError.value = 'Failed to join group. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    mapOrApiError.value = null;
    // When modal becomes visible, ensure selectedLocation is current user's location or null
    selectedLocation.value = authStore.user?.location || null;

    // If no initial location, attempt to pan to browser location after a short delay
    // to ensure map component is ready.
    if (!selectedLocation.value) {
      setTimeout(() => {
        if (isModalOpen.value && locationPickerMapRef.value) { // Check if modal is still open
          triggerPanToBrowserLocation();
        }
      }, 200);
    }
  }
});
</script>

<style scoped>
.modal-body-content {
  /* Add any specific styling for the modal body here */
}
</style>
