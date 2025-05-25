<template>
  <BCard class="h-100">
    <BCardBody>
      <BCardTitle class="mb-2 fs-6" :class="titleClass">
        <component :is="placeIconComponent" :size="20" class="me-2 align-middle" />
        <span class="align-middle">{{ place.name }}</span>
      </BCardTitle>
      <BCardText>
        <MapPinIcon :size="16" class="me-1 align-middle" />
        <small class="align-middle">
          <a class="text-decoration-none text-info-emphasis" :href="place.map_uri" target="_blank"
            rel="noopener noreferrer">
            {{ place.address }}
          </a>
        </small>
      </BCardText>
      <BCardText v-if="place.rating">
        <StarIcon :size="16" class="me-1 align-middle text-success" fill="currentColor" />
        <small class="align-middle">{{ place.rating }} / 5</small>
      </BCardText>
      <!-- Add more place details here as needed -->
    </BCardBody>
  </BCard>
</template>

<script setup lang="ts">
import type { GroupPlaceResponse } from '@/services/apiService';
import { MapPinIcon, BuildingIcon, StarIcon, BeerIcon, UtensilsIcon, CoffeeIcon, TreesIcon } from 'lucide-vue-next';
import { BCard, BCardBody, BCardText, BCardTitle } from 'bootstrap-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  place: GroupPlaceResponse;
}>();

const placeIconComponent = computed(() => {
  switch (props.place.type?.toLowerCase()) {
    case 'bar':
      return BeerIcon;
    case 'restaurant':
      return UtensilsIcon;
    case 'cafe':
      return CoffeeIcon;
    case 'park':
      return TreesIcon;
    default:
      return BuildingIcon;
  }
});

const titleClass = computed(() => {
  switch (props.place.type?.toLowerCase()) {
    case 'bar':
      return 'title-bar';
    case 'restaurant':
      return 'title-restaurant';
    case 'cafe':
      return 'title-cafe';
    case 'park':
      return 'title-park';
    default:
      return '';
  }
});
</script>

<style scoped>
.card-title .lucide-icon,
.card-subtitle .lucide-icon,
.card-text .lucide-icon {
  vertical-align: middle;
}

.title-bar {
  color: #4d94c7;
  /* darker pastel blue */
}

.title-restaurant {
  color: #d1596f;
  /* darker pastel red */
}

.title-cafe {
  color: #c89148;
  /* darker pastel light brown (tan) */
}

.title-park {
  color: #66BB6A;
  /* darker pastel green */
}
</style>
