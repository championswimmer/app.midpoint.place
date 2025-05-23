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

    <!-- Placeholder for future member list -->
    <div class="mt-4">
      <h3>Members</h3>
      <p>Member list will be here.</p>
    </div>
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
import { User, Users, Lock, Unlock, EyeOff, CircleDot } from 'lucide-vue-next';

const route = useRoute();
const errorStore = useErrorStore();

const group = ref<GroupResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

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
