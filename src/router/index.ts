import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { usePostHog } from '../services/posthog'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/create_group',
      name: 'create_group',
      component: () => import('../views/CreateGroupView.vue'),
    },
    {
      path: '/groups/:groupcode',
      name: 'group-view',
      component: () => import('../views/GroupView.vue'),
      props: true
    },
  ],
})

const { posthog } = usePostHog()

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)

  // Attempt to initialize auth state, e.g. load from localStorage
  // This is important if the page is refreshed or app is loaded for the first time
  if (!authStore.isAuthenticated && authStore.token) {
    authStore.fetchUser() // This action should ideally populate `user` and update `isAuthenticated`
  }


  if (authRequired && !authStore.isAuthenticated) {
    // Store the original path to redirect back after login
    // Avoid storing if it's already a redirect from login or register
    if (to.name !== 'login' && to.name !== 'register') {
      localStorage.setItem('redirectPath', to.fullPath);
    }
    return { name: 'login' }
  }

  if (to.path !== from.path) {
    posthog.capture('$pageleave')
  }
})

router.afterEach(() => {
  posthog.capture('$pageview')
})

export default router
