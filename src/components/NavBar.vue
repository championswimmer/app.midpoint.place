<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BNavbar, BNavbarBrand, BNavbarNav, BNavItem, BCollapse } from 'bootstrap-vue-next'
import { LocateFixed, MapPinned, LogIn, UserPlus, User, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth' // Import the auth store
import { storeToRefs } from 'pinia' // Import storeToRefs for reactive access to getters

const authStore = useAuthStore()
const { isAuthenticated, currentUser } = storeToRefs(authStore) // Use storeToRefs for reactive getters

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <BNavbar toggleable="lg" class="container-fluid">
    <BNavbarBrand to="/" class="fw-bold d-flex align-items-center">
      <LocateFixed class="me-2 text-primary" />
      <span class="text-primary fw-bold">midpoint</span>
      <span class="text-muted fw-normal">⋅</span>
      <span class="text-secondary fw-bold">place</span>
      <MapPinned class="ms-2 text-secondary" />
    </BNavbarBrand>

    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav class="ms-auto">
        <template v-if="!isAuthenticated">
          <BNavItem>
            <RouterLink to="/login" class="nav-link d-flex align-items-center">
              <LogIn class="me-1" :size="18" />
              Login
            </RouterLink>
          </BNavItem>
          <BNavItem>
            <RouterLink to="/register" class="nav-link d-flex align-items-center">
              <UserPlus class="me-1" :size="18" />
              Register
            </RouterLink>
          </BNavItem>
        </template>
        <template v-else>
          <BNavItem v-if="currentUser">
            <span class="nav-link d-flex align-items-center">
              <User class="me-1" :size="18" />
              {{ currentUser.username }}
            </span>
          </BNavItem>
          <BNavItem>
            <a href="#" @click.prevent="handleLogout" class="nav-link d-flex align-items-center">
              <LogOut class="me-1" :size="18" />
              Logout
            </a>
          </BNavItem>
        </template>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style scoped>
/* Add any custom styles if needed */
.navbar-brand img {
  margin-right: 0.5rem;
}
</style>
