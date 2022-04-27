import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { websiteTitle } from '@/config'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.afterEach((to) => {
  const { title } = to.meta
  document.title = title ? `${title} - ${websiteTitle}` : websiteTitle
})

export default router
