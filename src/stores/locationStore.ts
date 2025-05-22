import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', {
  state: () => ({
    isLocationUpdateModalVisible: false,
  }),
  actions: {
    openLocationUpdateModal() {
      this.isLocationUpdateModalVisible = true
    },
    closeLocationUpdateModal() {
      this.isLocationUpdateModalVisible = false
    },
  },
})
