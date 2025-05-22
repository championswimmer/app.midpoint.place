<script setup lang="ts">
import { ref, onMounted } from 'vue';
import apiService, { type GroupResponse } from '../services/apiService';
import GroupCard from '../components/GroupCard.vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import { useAuthStore } from '../stores/auth';

const allGroups = ref<GroupResponse[]>([]);
const createdGroups = ref<GroupResponse[]>([]);
const joinedGroups = ref<GroupResponse[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const authStore = useAuthStore();

onMounted(async () => {
  // Initialize auth state and set token in apiService if available
  await authStore.fetchUser();

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
      <h1 class="text-center fw-bold fs-3 my-2">
        Welcome to Midpoint Place
      </h1>
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
