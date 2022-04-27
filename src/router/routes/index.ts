import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由配置
 * @description 所有路由都在这里集中管理
 */
const routes: RouteRecordRaw[] = [
  /**
   * 首页
   */
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '@views/home.vue'),
    meta: {
      title: 'Home',
    },
  },
  {
    path: '/build',
    name: 'build',
    component: () => import(/* webpackChunkName: "build" */ '@views/build.vue'),
    meta: {
      title: 'Build',
    },
  },
]

export default routes
