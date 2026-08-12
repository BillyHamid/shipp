<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

interface NavItem {
  label: string
  to: string
  perm?: string
}
interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  { title: '', items: [{ label: 'Tableau de bord', to: '/' }] },
  {
    title: 'Logistique',
    items: [
      { label: 'BOX', to: '/boxes', perm: 'boxes.read' },
      { label: 'Colis', to: '/parcels', perm: 'parcels.read' },
      { label: 'Clients', to: '/customers', perm: 'customers.read' },
    ],
  },
  {
    title: 'Caisse',
    items: [
      { label: 'Comptes', to: '/cash/accounts', perm: 'cash.read' },
      { label: 'Opérations', to: '/cash/operations', perm: 'cash.read' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { label: 'Tarifs', to: '/pricing', perm: 'pricing.read' },
      { label: 'Utilisateurs', to: '/users', perm: 'users.read' },
    ],
  },
]

const visibleSections = computed(() =>
  sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.perm || auth.can(i.perm)) }))
    .filter((s) => s.items.length > 0),
)

const mobileNavOpen = ref(false)

function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col
             transition-transform lg:translate-x-0"
      :class="mobileNavOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="h-16 flex items-center gap-2 px-5 border-b border-slate-100">
        <div class="size-9 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
          GSG
        </div>
        <span class="font-semibold text-slate-800">GSGLOGISTIQUE</span>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div v-for="section in visibleSections" :key="section.title">
          <p v-if="section.title" class="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {{ section.title }}
          </p>
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'"
            @click="mobileNavOpen = false"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-3">
          <div class="size-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
            {{ auth.user?.fullName?.[0] ?? '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">{{ auth.user?.fullName }}</p>
            <p class="text-xs text-slate-400 truncate">{{ auth.user?.role }}</p>
          </div>
          <button class="text-slate-400 hover:text-slate-700" title="Déconnexion" @click="onLogout">⏻</button>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 bg-black/30 z-20 lg:hidden"
      @click="mobileNavOpen = false"
    />

    <!-- Main -->
    <div class="flex-1 lg:pl-64">
      <header class="h-16 bg-white border-b border-slate-200 flex items-center px-5 lg:hidden">
        <button class="text-slate-600" @click="mobileNavOpen = true">☰</button>
      </header>

      <main class="p-5 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
