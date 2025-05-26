import { defineStore } from 'pinia';
import apiService, { type UserResponse, type LoginUserRequest, type CreateUserRequest } from '@/services/apiService';
import router from '@/router';
import { AxiosError } from 'axios';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  persist: true,
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    isLoading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    authError: (state) => state.error,
    isAuthLoading: (state) => state.isLoading,
  },
  actions: {
    async login(loginData: LoginUserRequest) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiService.loginUser(loginData);
        if (response.token && response.id) {
          this.token = response.token;
          this.user = response;
          apiService.updateAuthToken(response.token);
          localStorage.setItem('authToken', response.token);
          // Fetch full user details if login response is partial or to ensure consistency
          // For now, we assume loginUser returns sufficient UserResponse
          // If not, an additional call to a getUserById endpoint would be needed here.
          const redirectPath = localStorage.getItem('redirectPath');
          if (redirectPath) {
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else {
            router.push('/'); // Redirect to home or dashboard after login
          }
        } else {
          throw new Error('Login failed: No token or user ID received.');
        }
      } catch (err) {
        if (err instanceof AxiosError && err.response?.data?.message) {
          this.error = err.response.data.message;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'An unknown error occurred during login.';
        }
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
      } finally {
        this.isLoading = false;
      }
    },
    async register(registerData: CreateUserRequest) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiService.registerUser(registerData);
        if (response.token && response.id) {
          this.token = response.token;
          this.user = response;
          apiService.updateAuthToken(response.token);
          localStorage.setItem('authToken', response.token);
          router.push('/'); // Redirect to home or dashboard after registration
        } else {
          throw new Error('Registration failed: No token or user ID received.');
        }
      } catch (err) {
        if (err instanceof AxiosError && err.response?.data?.message) {
          this.error = err.response.data.message;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'An unknown error occurred during registration.';
        }
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
      } finally {
        this.isLoading = false;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('authToken');
      apiService.updateAuthToken(''); // Clear token in apiService
      router.push('/login');
    },
    updateUserLocation(location: { latitude: number; longitude: number }) {
      if (this.user) {
        this.user = { ...this.user, location };
      }
    },
    async fetchUser() {
      // This action is used to initialize the auth state, for example, on application load.
      // If a token exists (e.g., from localStorage), update the apiService header.
      if (this.token) {
        apiService.updateAuthToken(this.token);
        // The original logic to fetch full user details can be expanded here if needed,
        // for example, by calling a /users/me endpoint.
        // For now, ensuring the token is set in apiService is the primary goal.
        if (!this.user) {
          // This block can be used to fetch user details if they are not already in the store.
          // console.log('User details not in store, consider fetching from /users/me');
        }
      } else {
        // If no token, ensure any potentially stale token in apiService is cleared.
        // This is usually handled by logout, but good for consistency.
        apiService.updateAuthToken('');
      }
    }
  },
});
