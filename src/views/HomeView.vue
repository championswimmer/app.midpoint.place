<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiService, { type GroupResponse } from '../services/apiService';
import GroupCard from '../components/GroupCard.vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import { useAuthStore } from '../stores/auth';
import { useLocationStore } from '@/stores/locationStore';
import { RouterLink } from 'vue-router';

const allGroups = ref<GroupResponse[]>([]);
const createdGroups = ref<GroupResponse[]>([]);
const joinedGroups = ref<GroupResponse[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const authStore = useAuthStore();
const locationStore = useLocationStore();
const router = useRouter();

interface AnimatedWord {
  text: string;
  highlightClass: string;
}

const wordsToAnimate: AnimatedWord[] = [
  { text: 'park', highlightClass: 'bg-success-subtle text-success-emphasis' },
  { text: 'cafe', highlightClass: 'bg-warning-subtle text-warning-emphasis' }, // Using warning for light brown
  { text: 'restaurant', highlightClass: 'bg-danger-subtle text-danger-emphasis' },
  { text: 'pub', highlightClass: 'bg-primary-subtle text-primary-emphasis' }, // Assuming Bootstrap 5.3+ for orange
  { text: 'museum', highlightClass: 'bg-info-subtle text-info-emphasis' },    // Using info for a gold-like hue
  { text: 'nightclub', highlightClass: 'bg-dark-subtle text-dark-emphasis' },  // Using dark for dark blue
];

const currentWordIndex = ref(0);
const animatedWord = ref<AnimatedWord>(wordsToAnimate[0]);

onMounted(async () => {
  await authStore.fetchUser();

  if (!authStore.isAuthenticated) {
    router.push('/login');
    return; // Stop further execution in onMounted if not authenticated
  }

  if (authStore.user && (!authStore.user.location || (authStore.user.location.latitude === 0 && authStore.user.location.longitude === 0))) {
    locationStore.openLocationUpdateModal();
  }

  // Watch for changes in authentication state after initial check
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      router.push('/login');
    }
  }, { immediate: false }); // immediate: false, because we already check onMounted

  setInterval(() => {
    currentWordIndex.value = (currentWordIndex.value + 1) % wordsToAnimate.length;
    animatedWord.value = wordsToAnimate[currentWordIndex.value];
  }, 1500);

  try {
    isLoading.value = true;
    error.value = null;
    const [publicGroups, creatorGroups, memberGroups] = await Promise.all([
      apiService.listPublicGroups(),
      apiService.listPublicGroups('creator'),
      apiService.listPublicGroups('member')
    ]);
    allGroups.value = publicGroups;
    createdGroups.value = creatorGroups;
    joinedGroups.value = memberGroups;
  } catch (err) {
    console.error('Error fetching groups:', err);
    error.value = 'Failed to load groups. Please try again later.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main>
    <header>
      <div class="container text-center my-3">
        <h1 class="display-6 fw-bold mb-2">
          Ready to find the perfect <span class="bg-primary-subtle text-primary-emphasis px-2 rounded">meeting
            spot</span>?
        </h1>
        <p class="lead fs-5 mb-3">
          Create a group, invite your friends, find a convinient&nbsp;
          <Transition name="fade" mode="out-in">
            <span :key="animatedWord.text" :class="animatedWord.highlightClass" class="px-2 rounded"
              style="display: inline-block; min-width: 8rem; text-align: center;">
              {{ animatedWord.text }}
            </span>
          </Transition>
          &nbsp;at the middle from everyone!
        </p>
        <RouterLink to="/create_group" class="btn btn-primary btn-lg">
          Create New Group
        </RouterLink>
      </div>
    </header>
    <section class="container mt-4">
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      <BTabs v-if="!isLoading && !error" content-class="mt-3">
        <BTab title="All Groups" active>
          <div v-if="allGroups.length === 0" class="text-center text-muted">
            No public groups found.
          </div>
          <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            <div v-for="group in allGroups" :key="group.id" class="col">
              <GroupCard :group="group" />
            </div>
          </div>
        </BTab>
        <BTab title="Created Groups">
          <div v-if="createdGroups.length === 0" class="text-center text-muted">
            You haven't created any groups yet.
          </div>
          <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            <div v-for="group in createdGroups" :key="group.id" class="col">
              <GroupCard :group="group" />
            </div>
          </div>
        </BTab>
        <BTab title="Joined Groups">
          <div v-if="joinedGroups.length === 0" class="text-center text-muted">
            You haven't joined any groups yet.
          </div>
          <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            <div v-for="group in joinedGroups" :key="group.id" class="col">
              <GroupCard :group="group" />
            </div>
          </div>
        </BTab>
      </BTabs>
    </section>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
