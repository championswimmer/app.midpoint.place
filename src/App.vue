<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import ErrorToast from './components/ErrorToast.vue'
import LocationUpdateModal from './views/LocationUpdateModal.vue'
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <NavBar />
    <main class="flex-shrink-0 mb-4">
      <RouterView />
    </main>
    <ErrorToast />
    <LocationUpdateModal />
  </div>
</template>

<style scoped>
/* Add any custom styles if needed */
</style>
