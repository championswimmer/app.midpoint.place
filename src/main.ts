import './assets/main.css'
import { createBootstrap } from 'bootstrap-vue-next'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createBootstrap())
app.use(createPinia())
app.use(router)

app.mount('#app')
