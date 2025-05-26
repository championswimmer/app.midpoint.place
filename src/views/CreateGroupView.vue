<template>
  <div class="container mt-4">
    <h2>Create New Group</h2>
    <BForm @submit.prevent="handleSubmit">
      <!-- Name -->
      <BFormGroup id="name-group" label="Group Name:" label-for="name" class="mb-3">
        <BFormInput id="name" v-model="name" type="text" required :state="nameState" placeholder="Enter group name">
        </BFormInput>
        <BFormInvalidFeedback :state="nameState">
          Name must be 100 characters or less.
        </BFormInvalidFeedback>
      </BFormGroup>

      <!-- Radius -->
      <BFormGroup id="radius-group" :label="`Radius: ${radiusKm} km (${radiusMi.toFixed(1)} mi)`"
        label-for="radius-slider" description="The radius around the midpoint where places to meet would be searched."
        class="mb-3">
        <BFormInput id="radius-slider" v-model.number="radiusKm" type="range" min="0.2" max="5" step="0.1"></BFormInput>
      </BFormGroup>

      <!-- Type -->
      <BFormGroup label="Group Type:" class="mb-3">
        <div class="d-flex justify-content-between">
          <BCard v-for="option in groupTypeDetails" :key="option.value"
            :class="['type-card', { 'selected': type === option.value }]" @click="selectType(option.value)" tag="div"
            style="cursor: pointer; flex: 1; margin-right: 10px;"
            :border-variant="type === option.value ? 'primary' : undefined">
            <BCardTitle :title-tag="'h6'">{{ option.text }}</BCardTitle>
            <BCardText style="font-size: 0.85rem;">{{ option.description }}</BCardText>
          </BCard>
        </div>
      </BFormGroup>

      <!-- Secret (conditionally shown for Private groups) -->
      <BFormGroup v-if="type === GroupType.Private" id="secret-group" label="Secret:" label-for="secret"
        description="A 6-digit secret required to join this private group." class="mb-3">
        <BFormInput id="secret" v-model="secret" type="text" :state="secretState" placeholder="Enter 6-digit secret"
          pattern="\d{6}" maxlength="6"></BFormInput>
        <BFormInvalidFeedback :state="secretState">
          Secret must be exactly 6 digits.
        </BFormInvalidFeedback>
      </BFormGroup>

      <BButton type="submit" variant="primary">Create Group</BButton>
    </BForm>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiService, { type CreateGroupRequest } from '@/services/apiService';
import { useErrorStore } from '@/stores/error';
import { BCard, BCardTitle, BCardText } from 'bootstrap-vue-next';

// Corresponds to the enum in apiService.ts
enum GroupType {
  Public = 'public',
  Protected = 'protected',
  Private = 'private'
}

interface GroupTypeDetail {
  value: GroupType;
  text: string;
  description: string;
}

const KM_TO_MILES_CONVERSION_FACTOR = 0.621371;

const router = useRouter();
const errorStore = useErrorStore();

const name = ref('');
const radiusKm = ref(1.5); // Default radius 1.5 km
const radius = ref<number | undefined>(radiusKm.value * 1000); // Radius in meters for the API
const type = ref<GroupType>(GroupType.Public); // Default to Public
const secret = ref('');

// Watch for changes in radiusKm to update radius in meters
watch(radiusKm, (newKmValue) => {
  radius.value = newKmValue * 1000;
});

const radiusMi = computed(() => {
  return radiusKm.value * KM_TO_MILES_CONVERSION_FACTOR;
});

const groupTypeDetails: GroupTypeDetail[] = [
  { value: GroupType.Public, text: 'Public', description: 'Shows on home page, can be searched.' },
  { value: GroupType.Protected, text: 'Protected', description: 'Cannot be searched, only joinable via a direct link.' },
  { value: GroupType.Private, text: 'Private', description: 'Cannot be searched, needs a secret to join via a direct link.' },
];

const selectType = (selectedType: GroupType) => {
  type.value = selectedType;
};

const nameState = computed(() => {
  if (name.value.length === 0) return null;
  return name.value.length > 0 && name.value.length <= 100;
});

const secretState = computed(() => {
  if (type.value !== GroupType.Private) return null;
  if (secret.value.length === 0 && (type.value === GroupType.Private)) return false;
  return /^\d{6}$/.test(secret.value);
});

const handleSubmit = async () => {
  errorStore.clearError();

  if (!nameState.value && name.value.length > 0) {
    errorStore.setError('Please fix the errors in the form.');
    return;
  }
  if (name.value.length === 0) {
    errorStore.setError('Group name is required.');
    return;
  }

  if (type.value === GroupType.Private && !secretState.value) {
    errorStore.setError('Secret must be exactly 6 digits for private groups.');
    return;
  }

  const requestData: CreateGroupRequest = {
    name: name.value,
    type: type.value,
  };

  if (radius.value !== undefined && radius.value >= 200 && radius.value <= 5000) { // Ensure radius is within 0.2km to 5km (200m to 5000m)
    requestData.radius = radius.value;
  }

  if (type.value === GroupType.Private) {
    if (!/^\d{6}$/.test(secret.value)) {
      errorStore.setError('Secret must be exactly 6 digits for private groups.');
      return;
    }
    requestData.secret = secret.value;
  }

  try {
    const newGroup = await apiService.createGroup(requestData);
    if (newGroup && newGroup.code) {
      router.push(`/groups/${newGroup.code}`);
    } else {
      errorStore.setError('Failed to create group. Group code not received.');
    }
  } catch (err) {
    console.error('Failed to create group:', err);
    if (!errorStore.errorMessage) {
      errorStore.setError('An unexpected error occurred while creating the group.');
    }
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
.container {
  max-width: 600px;
}

.type-card {
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.type-card:last-child {
  margin-right: 0 !important;
}

.type-card.selected {
  border-width: 2px;
  /* border-color: var(--bs-primary); Using border-variant on BCard instead */
}

/* Ensure cards take up equal width and look good */
.d-flex>.type-card {
  margin-bottom: 1rem;
  /* Add some space below cards if they wrap */
}
</style>
