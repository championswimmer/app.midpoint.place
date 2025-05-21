import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import { createBootstrap } from 'bootstrap-vue-next'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Add our CSS
import './assets/main.css'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createBootstrap())



app.mount('#app')
