<template>
  <BToast v-model="errorStore.showError" title="Error" variant="danger" solid toaster="b-toaster-top-center">
    {{ errorStore.errorMessage }}
  </BToast>
</template>

<script setup lang="ts">
import { useErrorStore } from '@/stores/error';
import { BToast } from 'bootstrap-vue-next';

const errorStore = useErrorStore();
</script>
