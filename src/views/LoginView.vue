<template>
  <div class="login-view">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" v-model="email" required>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="password" required>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="auth.isAuthLoading">
        <span v-if="auth.isAuthLoading" class="spinner-border spinner-border-sm" role="status"
          aria-hidden="true"></span>
        Login
      </button>
      <div v-if="auth.authError" class="alert alert-danger mt-3" role="alert">
        {{ auth.authError }}
      </div>
    </form>
    <p class="mt-3">
      Don't have an account? <router-link to="/register">Register</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const auth = useAuthStore();

const handleLogin = async () => {
  await auth.login({ email: email.value, password: password.value });
};
</script>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

form {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}
</style>
