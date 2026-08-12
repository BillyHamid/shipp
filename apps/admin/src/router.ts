import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true } },

  {
    path: '/',
    component: () => import('./layouts/AppShell.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('./views/DashboardView.vue') },

      { path: 'boxes', name: 'boxes', component: () => import('./views/boxes/BoxesListView.vue') },
      { path: 'boxes/:id', name: 'box-detail', component: () => import('./views/boxes/BoxDetailView.vue'), props: true },

      { path: 'parcels', name: 'parcels', component: () => import('./views/parcels/ParcelsListView.vue') },
      { path: 'parcels/new', name: 'parcel-create', component: () => import('./views/parcels/ParcelCreateView.vue') },
      { path: 'parcels/:id', name: 'parcel-detail', component: () => import('./views/parcels/ParcelDetailView.vue'), props: true },

      { path: 'customers', name: 'customers', component: () => import('./views/customers/CustomersListView.vue') },

      { path: 'cash/accounts', name: 'cash-accounts', component: () => import('./views/cash/CashAccountsView.vue') },
      { path: 'cash/operations', name: 'cash-operations', component: () => import('./views/cash/CashOperationsView.vue') },

      { path: 'pricing', name: 'pricing', component: () => import('./views/pricing/PricingView.vue') },
      { path: 'users', name: 'users', component: () => import('./views/users/UsersView.vue') },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})
