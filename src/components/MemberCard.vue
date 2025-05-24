<template>
  <BCard class="h-100">
    <BCardBody>
      <BCardTitle class="mb-3 fs-6">
        <UserIcon :size="20" class="me-2 align-middle" />
        <span class="align-middle">{{ member.username }}</span>
      </BCardTitle>
      <BCardText v-if="member.latitude && member.longitude">
        <MapPinIcon :size="16" class="me-1 align-text-bottom" />
        <small class="text-muted align-bottom">
          {{ member.latitude.toFixed(4) }}, {{ member.longitude.toFixed(4) }}
        </small>
      </BCardText>
      <BCardText v-else>
        <small class="text-muted">Location not available</small>
      </BCardText>
      <!-- Add more member details here as needed -->
    </BCardBody>
  </BCard>
</template>

<script setup lang="ts">
import type { GroupUserResponse } from '@/services/apiService';
import { MapPinIcon, UserIcon } from 'lucide-vue-next';
import { BCard, BCardBody, BCardText, BCardTitle } from 'bootstrap-vue-next';

defineProps<{
  member: GroupUserResponse;
}>();
</script>

<style scoped>
.card-title .lucide-icon {
  vertical-align: middle;
}
</style>
