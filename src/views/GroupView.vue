<template>
  <div class="container mt-4" v-if="group">
    <div class="row">
      <div class="col-md-8 col-lg-5">
        <h1 class="text-primary fw-bolder">{{ group.name }}</h1>
        <p class="text-muted">Group Code: <span class="font-monospace">{{ group.code }}</span></p>
        <p>
          <User :size="18" class="me-1 align-text-bottom" /> Created by: <strong class="text-secondary fw-medium">{{
            group.creator.display_name
          }}</strong>
        </p>
        <p>
          <Users :size="18" class="me-1 align-text-bottom" /> Members: {{ groupMemberCount }}
        </p>
        <p>
          <component :is="groupTypeIcon(group.type)" :size="18" class="me-1 align-text-bottom" /> Type: <span
            :class="groupTypeColorClass">{{ group.type }}</span>
        </p>
        <p v-if="group.radius">
          <CircleDot :size="18" class="me-1 align-text-bottom" /> Radius: {{ (group.radius / 1000).toFixed(1) }} km
        </p>
      </div>
      <div class="col-md-4 col-lg-7">
        <div v-if="group && mapMidpoint" class="ratio ratio-16x9">
          <MultiItemMap :users="mapUsers" :places="mapPlaces" :midpoint="mapMidpoint" @map-load-error="handleMapError"
            style="position: absolute; top:0; left:0; width:100%; height:100%;" />
        </div>
        <div v-else class="card ratio ratio-16x9">
          <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
            <p class="card-text">Map loading or not available...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Join/Leave Group Button -->
    <div class="mt-4 d-flex gap-2">
      <BButton variant="outline-success" @click="joinGroupAction" :disabled="isGroupMember || isUpdatingMembership">
        <span v-if="isUpdatingMembership && !isGroupMember" class="spinner-border spinner-border-sm me-1" role="status"
          aria-hidden="true"></span>
        <UserPlusIcon v-else :size="18" class="me-1 align-middle" />
        Join Group
      </BButton>
      <BButton variant="outline-danger" @click="leaveGroupAction" :disabled="!isGroupMember || isUpdatingMembership">
        <span v-if="isUpdatingMembership && isGroupMember" class="spinner-border spinner-border-sm me-1" role="status"
          aria-hidden="true"></span>
        <UserMinusIcon v-else :size="18" class="me-1 align-middle" />
        Leave Group
      </BButton>
    </div>

    <!-- Tabs for Members and Places -->
    <BTabs v-model="activeTab" class="mt-4">
      <BTab title="Members">
        <div v-if="group && group.members && group.members.length > 0" class="row mt-3">
          <div v-for="member in group.members" :key="member.user_id" class="col-md-4 mb-3">
            <MemberCard :member="member" />
          </div>
        </div>
        <p v-else-if="group && (!group.members || group.members.length === 0)" class="mt-3">
          No members in this group yet.
        </p>
      </BTab>
      <BTab title="Places">
        <div v-if="group && sortedPlaces && sortedPlaces.length > 0" class="row mt-3">
          <div v-for="place in sortedPlaces" :key="place.id" class="col-md-4 mb-3">
            <PlaceCard :place="place" />
          </div>
        </div>
        <p v-else-if="group && (!group.places || group.places.length === 0)" class="mt-3">
          No places added to this group yet.
        </p>
      </BTab>
    </BTabs>

    <!-- Join Group Modal -->
    <JoinGroupModal :is-visible="isJoinGroupModalVisible" :group-code="groupCode"
      @update:is-visible="isJoinGroupModalVisible = $event" @join-successful="handleJoinSuccess" />

  </div>
  <div v-else-if="isLoading" class="container mt-4 text-center">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading group details...</span>
    </div>
  </div>
  <div v-else-if="error" class="container mt-4">
    <div class="alert alert-danger" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiService, { type GroupResponse } from '@/services/apiService';
import { useErrorStore } from '@/stores/error';
import { useAuthStore } from '@/stores/auth';
import { BButton, BTabs, BTab } from 'bootstrap-vue-next';
import { User, Users, Lock, Unlock, EyeOff, CircleDot, UserPlusIcon, UserMinusIcon } from 'lucide-vue-next';
import MemberCard from '@/components/MemberCard.vue';
import PlaceCard from '@/components/PlaceCard.vue';
import JoinGroupModal from '@/components/JoinGroupModal.vue';
import MultiItemMap from '@/components/MultiItemMap.vue';

const route = useRoute();
const errorStore = useErrorStore();
const authStore = useAuthStore();

const group = ref<GroupResponse | null>(null);
const isLoading = ref(true);
const isUpdatingMembership = ref(false);
const error = ref<string | null>(null);
const activeTab = ref(0); // 0 for Members, 1 for Places
const isJoinGroupModalVisible = ref(false); // Added for modal visibility
const mapError = ref<string | null>(null);

const groupCode = computed(() => route.params.groupcode as string);

const mapUsers = computed(() => {
  if (!group.value || !group.value.members) return [];
  return group.value.members.map(member => ({
    id: member.user_id,
    location: { latitude: member.latitude, longitude: member.longitude }, // Use direct lat/lng
    username: member.display_name,
    name: member.display_name, // for MapItem compatibility
  }));
});

const mapPlaces = computed(() => {
  if (!group.value || !group.value.places) return [];
  return group.value.places.map(place => ({
    ...place,
    location: { latitude: place.latitude, longitude: place.longitude }, // Use direct lat/lng
  }));
});

const mapMidpoint = computed(() => {
  // Removed direct check for group.center_latitude/longitude as it's not in GroupResponse
  // Fallback logic if group center is not defined
  if (mapPlaces.value.length > 0 && mapPlaces.value[0].location) {
    return mapPlaces.value[0].location;
  }
  if (mapUsers.value.length > 0 && mapUsers.value[0].location) {
    return mapUsers.value[0].location;
  }
  return { latitude: 37.0902, longitude: -95.7129 }; // Default to center of US
});

const sortedPlaces = computed(() => {
  if (group.value && group.value.places) {
    return [...group.value.places].sort((a, b) => {
      // Handle cases where rating might be null or undefined
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return ratingB - ratingA; // Sort descending
    });
  }
  return [];
});

const groupMemberCount = computed(() => {
  if (group.value) {
    if (group.value.members && Array.isArray(group.value.members)) {
      return group.value.members.length;
    }
    if (typeof group.value.member_count === 'number') {
      return group.value.member_count;
    }
  }
  return 0;
});

const groupTypeColorClass = computed(() => {
  if (!group.value) return '';
  switch (group.value.type) {
    case 'public':
      return 'text-success';
    case 'protected':
      return 'text-warning';
    case 'private':
      return 'text-danger';
    default:
      return ''; // Or a default color like 'text-muted'
  }
});

const isGroupMember = computed(() => {
  if (!group.value || !group.value.members || !authStore.currentUser) {
    return false;
  }
  return group.value.members.some(member => member.user_id === authStore.currentUser!.id);
});

const groupTypeIcon = (type: string) => {
  switch (type) {
    case 'public':
      return Unlock;
    case 'protected':
      return EyeOff;
    case 'private':
      return Lock;
    default:
      return Unlock;
  }
};

const handleMapError = (message: string) => {
  mapError.value = message;
  // Optionally, display this error in the UI more prominently
  console.error("Map Error:", message);
};

async function refreshGroupDetails() {
  if (!groupCode.value) {
    error.value = 'Group code is missing.'; // Should not happen if already loaded once
    return;
  }
  try {
    // Preserve loading state for the main content if it was already loading.
    // If not, set a specific loading state for the refresh action if needed,
    // but for now, we'll rely on the button's spinner.
    // isLoading.value = true; // Optional: re-enable full page loader
    errorStore.clearError();
    error.value = null;
    group.value = await apiService.getGroup(groupCode.value, true, true);
  } catch (err) {
    console.error('Failed to refresh group details:', err);
    const errorResponse = err as { response?: { data?: { detail?: string } } };
    if (errorResponse.response && errorResponse.response.data && errorResponse.response.data.detail) {
      error.value = errorResponse.response.data.detail;
    } else {
      error.value = 'Failed to refresh group details. Please try again later.';
    }
  } finally {
    // isLoading.value = false; // Optional: if full page loader was enabled
  }
}

async function joinGroupAction() {
  if (!groupCode.value || !authStore.currentUser) {
    error.value = "Cannot join group: Missing group code or user information.";
    return;
  }
  if (!authStore.currentUser.location) {
    error.value = "Your location is not set. Please update your location first.";
    // TODO: Optionally, you could prompt the user to update their location from here.
    // For now, we just show an error and they would use the global location update mechanism.
    return;
  }
  isJoinGroupModalVisible.value = true; // Open the modal
}

async function handleJoinSuccess() {
  isJoinGroupModalVisible.value = false; // Close modal on success
  await refreshGroupDetails(); // Refresh group details
}

async function leaveGroupAction() {
  if (!groupCode.value) {
    error.value = "Cannot leave group: Missing group code.";
    return;
  }
  isUpdatingMembership.value = true;
  error.value = null; // Clear previous errors
  try {
    await apiService.leaveGroup(groupCode.value);
    await refreshGroupDetails(); // Refresh group data to reflect membership change
  } catch (err) {
    console.error('Failed to leave group:', err);
    const errorResponse = err as { response?: { data?: { detail?: string } } };
    if (errorResponse.response && errorResponse.response.data && errorResponse.response.data.detail) {
      error.value = errorResponse.response.data.detail;
    } else {
      error.value = 'Failed to leave group. Please try again later.';
    }
    // errorStore.setError(error.value); // Optionally set global error
  } finally {
    isUpdatingMembership.value = false;
  }
}

onMounted(async () => {
  if (!groupCode.value) {
    error.value = 'Group code is missing from the URL.';
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    errorStore.clearError();
    error.value = null;
    // Fetch group details. Assuming includeUsers and includePlaces might be needed later.
    group.value = await apiService.getGroup(groupCode.value, true, true);
  } catch (err) {
    console.error('Failed to fetch group details:', err);
    const errorResponse = err as { response?: { data?: { detail?: string } } };
    if (errorResponse.response && errorResponse.response.data && errorResponse.response.data.detail) {
      error.value = errorResponse.response.data.detail;
    } else {
      error.value = 'Failed to load group details. Please try again later.';
    }
    // errorStore.setError(error.value); // Optionally set global error
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.container {
  max-width: 960px;
}
</style>
