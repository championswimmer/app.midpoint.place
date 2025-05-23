<template>
  <BCard class="h-100">
    <BCardBody>
      <BCardTitle class="mb-2">
        <BuildingIcon :size="20" class="me-2 align-middle" />
        <span class="align-middle">{{ place.name }}</span>
      </BCardTitle>
      <BCardSubtitle class="mb-2 text-muted">
        <small>{{ place.type }}</small>
      </BCardSubtitle>
      <BCardText>
        <MapPinIcon :size="16" class="me-1 align-middle" />
        <small class="align-middle">{{ place.address }}</small>
      </BCardText>
      <BCardText v-if="place.rating">
        <StarIcon :size="16" class="me-1 align-middle text-warning" />
        <small class="align-middle">Rating: {{ place.rating }} / 5</small>
      </BCardText>
      <BButton :href="place.map_uri" variant="outline-primary" size="sm" target="_blank" class="mt-auto">
        <MapIcon :size="16" class="me-1" /> View on Map
      </BButton>
      <!-- Add more place details here as needed -->
    </BCardBody>
  </BCard>
</template>

<script setup lang="ts">
import type { GroupPlaceResponse } from '@/services/apiService';
import { MapPinIcon, BuildingIcon, StarIcon, MapIcon } from 'lucide-vue-next';
import { BCard, BCardBody, BCardText, BCardTitle, BCardSubtitle, BButton } from 'bootstrap-vue-next';

defineProps<{
  place: GroupPlaceResponse;
}>();
</script>

<style scoped>
.card-title .lucide-icon,
.card-subtitle .lucide-icon,
.card-text .lucide-icon {
  vertical-align: middle;
}
</style>
