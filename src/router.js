import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/create-event', component: () => import('./views/CreateEvent.vue') },
  { path: '/pay/:id', component: () => import('./views/PayEvent.vue'), props: true },
  { path: '/host-dashboard', component: () => import('./views/HostDashboard.vue') },
  { path: '/my-sent-gifts', component: () => import('./views/MySentGifts.vue') },
  { path: '/events', redirect: '/host-dashboard' },
  { path: '/ledger', redirect: '/host-dashboard' },
  { path: '/albums', component: () => import('./views/Albums.vue') },
  { path: '/albums/:id', component: () => import('./views/AlbumDetail.vue'), props: true },
  { path: '/a/:code', component: () => import('./views/AlbumDetail.vue'), props: true }
]

export default createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes
})
