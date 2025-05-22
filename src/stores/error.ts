import { defineStore } from 'pinia';

interface ErrorState {
  showError: boolean;
  errorMessage: string;
}

export const useErrorStore = defineStore('error', {
  state: (): ErrorState => ({
    showError: false,
    errorMessage: ''
  }),
  actions: {
    setError(message: string) {
      this.errorMessage = message;
      this.showError = true;
    },
    clearError() {
      this.showError = false;
      this.errorMessage = '';
    }
  }
});
