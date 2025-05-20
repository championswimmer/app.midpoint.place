<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BNavbar, BNavbarBrand, BNavbarNav, BNavItem, BCollapse } from 'bootstrap-vue-next'
import { LocateFixed, MapPinned } from 'lucide-vue-next'
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
        <BNavItem>
          <RouterLink to="/login" class="nav-link">Login</RouterLink>
        </BNavItem>
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
