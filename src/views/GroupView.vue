<template>
  <div class="container mt-4" v-if="group">
    <div class="row">
      <div class="col-md-8">
        <h1 class="text-primary fw-bolder">{{ group.name }}</h1>
        <p class="text-muted">Group Code: <span class="font-monospace">{{ group.code }}</span></p>
        <p>
          <User :size="18" class="me-1" /> Created by: <strong class="text-secondary fw-medium">{{
            group.creator.username
          }}</strong>
        </p>
        <p>
          <Users :size="18" class="me-1" /> Members: {{ groupMemberCount }}
        </p>
        <p>
          <component :is="groupTypeIcon(group.type)" :size="18" class="me-1" /> Type: <span
            :class="groupTypeColorClass">{{ group.type }}</span>
        </p>
        <p v-if="group.radius">
          <CircleDot :size="18" class="me-1" /> Radius: {{ (group.radius / 1000).toFixed(1) }} km
        </p>
      </div>
      <div class="col-md-4">
        <!-- Placeholder for future map -->
        <div class="card">
          <div class="card-body text-center">
            <p class="card-text">Map will be here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Join/Leave Group Button -->
    <div class="mt-4 d-flex gap-2">
      <BButton variant="outline-success" @click="joinGroupAction" :disabled="isGroupMember || isUpdatingMembership">
        <span v-if="isUpdatingMembership && !isGroupMember" class="spinner-border spinner-border-sm me-1" role="status"
          aria-hidden="true"></span>
        <UserPlusIcon v-else :size="18" class="me-1" />
        Join Group
      </BButton>
      <BButton variant="outline-danger" @click="leaveGroupAction" :disabled="!isGroupMember || isUpdatingMembership">
        <span v-if="isUpdatingMembership && isGroupMember" class="spinner-border spinner-border-sm me-1" role="status"
          aria-hidden="true"></span>
        <UserMinusIcon v-else :size="18" class="me-1" />
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
        <div v-if="group && group.places && group.places.length > 0" class="row mt-3">
          <div v-for="place in group.places" :key="place.id" class="col-md-4 mb-3">
            <PlaceCard :place="place" />
          </div>
        </div>
        <p v-else-if="group && (!group.places || group.places.length === 0)" class="mt-3">
          No places added to this group yet.
        </p>
      </BTab>
    </BTabs>

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
import apiService, { type GroupResponse, type GroupUserJoinRequest, type GroupUserResponse, type GroupPlaceResponse } from '@/services/apiService';
import { useErrorStore } from '@/stores/error';
import { useAuthStore } from '@/stores/auth';
import { BButton, BTabs, BTab } from 'bootstrap-vue-next';
import { User, Users, Lock, Unlock, EyeOff, CircleDot, UserPlusIcon, UserMinusIcon } from 'lucide-vue-next';
import MemberCard from '@/components/MemberCard.vue';
import PlaceCard from '@/components/PlaceCard.vue';

const route = useRoute();
const errorStore = useErrorStore();
const authStore = useAuthStore();

const group = ref<GroupResponse | null>(null);
const isLoading = ref(true);
const isUpdatingMembership = ref(false);
const error = ref<string | null>(null);
const activeTab = ref(0); // 0 for Members, 1 for Places

const groupCode = computed(() => route.params.groupcode as string);

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
  if (!groupCode.value || !authStore.currentUser || !authStore.currentUser.location) {
    error.value = "Cannot join group: Missing group code, user information, or user location.";
    // Potentially show a toast or more specific user feedback
    return;
  }
  isUpdatingMembership.value = true;
  error.value = null; // Clear previous errors
  try {
    const joinData: GroupUserJoinRequest = {
      latitude: authStore.currentUser.location.latitude,
      longitude: authStore.currentUser.location.longitude,
    };
    await apiService.joinGroup(groupCode.value, joinData);
    await refreshGroupDetails(); // Refresh group data to reflect membership change
  } catch (err) {
    console.error('Failed to join group:', err);
    const errorResponse = err as { response?: { data?: { detail?: string } } };
    if (errorResponse.response && errorResponse.response.data && errorResponse.response.data.detail) {
      error.value = errorResponse.response.data.detail;
    } else {
      error.value = 'Failed to join group. Please try again later.';
    }
    // errorStore.setError(error.value); // Optionally set global error
  } finally {
    isUpdatingMembership.value = false;
  }
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
