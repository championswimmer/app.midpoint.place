<script setup lang="ts">
import type { GroupResponse } from '../services/apiService';
import { User, Users, Lock, Unlock, EyeOff } from 'lucide-vue-next';

defineProps<{
  group: GroupResponse;
}>();

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
</script>

<template>
  <div class="card h-100">
    <div class="card-body">
      <h5 class="card-title text-primary fw-bold">{{ group.name }}</h5>
      <h6 class="card-subtitle mb-2 text-muted">
        Code: <span class="font-monospace">{{ group.code }}</span>
      </h6>
      <p class="card-text">
        <User :size="16" class="me-1" /> Creator: {{ group.creator.username }}
      </p>
      <p class="card-text">
        <Users :size="16" class="me-1" /> Members: {{ group.member_count ?? 0 }}
      </p>
      <p class="card-text">
        <component :is="groupTypeIcon(group.type)" :size="16" class="me-1" /> Type: {{ group.type }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.card {
  /* Add any specific card styling here if needed */
}
</style>
