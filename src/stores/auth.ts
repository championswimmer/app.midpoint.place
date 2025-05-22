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
          router.push('/'); // Redirect to home or dashboard after login
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
    async fetchUser() {
      // This action could be used to fetch user data if only a token is available
      // For example, on application load to verify token and get user info
      // Requires an endpoint like /users/me or /users/{id}
      // For now, we assume the user object is populated at login.
      // If a token exists from localStorage, we might want to verify it
      // and fetch user data.
      if (this.token && !this.user) {
        // Simulate fetching user based on token - replace with actual API call
        // This is a placeholder. You'd typically have a `getMe` endpoint.
        // For now, we'll re-use the token to update the apiService header,
        // but ideally, we'd fetch user data.
        apiService.updateAuthToken(this.token);
        // Placeholder: If your API doesn't return full user on login,
        // or if you need to refresh user data, you'd call an API here.
        // e.g., this.user = await apiService.getMe();
        // For now, if token exists but no user, it implies a previous session.
        // We might need to navigate to login or attempt to get user data.
        // This part needs clarification based on API capabilities for session resumption.
      }
    }
  },
});
