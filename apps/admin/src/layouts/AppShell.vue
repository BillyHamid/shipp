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
  icon: string
  perm?: string
}
interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  { title: '', items: [{ label: 'Tableau de bord', to: '/', icon: 'ph:squares-four-bold' }] },
  {
    title: 'Logistique',
    items: [
      { label: 'BOX', to: '/boxes', icon: 'ph:cube-bold', perm: 'boxes.read' },
      { label: 'Colis', to: '/parcels', icon: 'ph:package-bold', perm: 'parcels.read' },
      { label: 'Clients', to: '/customers', icon: 'ph:users-bold', perm: 'customers.read' },
    ],
  },
  {
    title: 'Caisse',
    items: [
      { label: 'Comptes', to: '/cash/accounts', icon: 'ph:wallet-bold', perm: 'cash.read' },
      { label: 'Opérations', to: '/cash/operations', icon: 'ph:arrows-left-right-bold', perm: 'cash.read' },
      { label: 'Dépenses', to: '/cash/expenses', icon: 'ph:receipt-bold', perm: 'cash.read' },
      { label: 'Associés', to: '/partners', icon: 'ph:handshake-bold', perm: 'cash.read' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { label: 'Tarifs', to: '/pricing', icon: 'ph:tag-bold', perm: 'pricing.read' },
      { label: 'Utilisateurs', to: '/users', icon: 'ph:user-gear-bold', perm: 'users.read' },
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

// Breadcrumb in the topbar — the current nav section + item, so a page
// buried under a detail route (e.g. /parcels/:id) still shows "Logistique /
// Colis" instead of a blank header.
const currentCrumb = computed(() => {
  for (const section of visibleSections.value) {
    const item = section.items.find((i) => isActive(i.to))
    if (item) return { section: section.title, label: item.label }
  }
  return null
})

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell min-h-screen flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 w-64 admin-sidebar flex flex-col
             transition-transform lg:translate-x-0"
      :class="mobileNavOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="h-24 flex items-center px-6 gap-3 border-b border-white/10">
        <img src="/logo.jpg" alt="Global Shipping Group" class="h-10 w-12 object-contain rounded-lg bg-white p-1" /><div><p class="text-white font-extrabold tracking-wide text-sm">GSG<span class="text-rose-300">.</span></p><p class="text-[9px] tracking-[.18em] text-rose-100/70 uppercase mt-0.5">Logistique</p></div>
      </div>

      <nav class="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        <div v-for="section in visibleSections" :key="section.title">
          <p v-if="section.title" class="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-300/60">
            {{ section.title }}
          </p>
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="group relative flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
            @click="mobileNavOpen = false"
          >
            <span
              class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-rose-300 transition-opacity"
              :class="isActive(item.to) ? 'opacity-100' : 'opacity-0'"
            />
            <Icon :icon="item.icon" class="size-[18px] shrink-0" :class="isActive(item.to) ? 'text-rose-300' : 'text-slate-300 group-hover:text-white'" />
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="mx-5 mb-5 p-4 rounded-xl border border-white/10 bg-white/[.03]"><p class="text-[10px] uppercase tracking-widest text-slate-400">Réseau international</p><p class="text-xs text-white mt-2 flex justify-between"><span>États-Unis</span><span class="text-rose-300">↔</span><span>Burkina Faso</span></p></div><div class="p-3 border-t border-white/5">
        <div class="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors">
          <div class="size-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {{ auth.user?.fullName?.[0] ?? '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ auth.user?.fullName }}</p>
            <p class="text-xs text-ink-300 truncate capitalize">{{ auth.user?.role?.replace('_', ' ') }}</p>
          </div>
          <button
            class="size-8 rounded-lg flex items-center justify-center text-ink-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title="Déconnexion"
            @click="onLogout"
          >
            <Icon icon="ph:sign-out-bold" class="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 bg-ink-950/50 z-20 lg:hidden"
      @click="mobileNavOpen = false"
    />

    <!-- Main -->
    <div class="min-w-0 flex-1 lg:pl-64 flex flex-col min-h-screen">
      <header class="h-20 bg-[#fffdfc]/90 backdrop-blur border-b border-ink-100 flex items-center gap-3 px-5 lg:px-9 shrink-0">
        <button aria-label="Ouvrir la navigation" class="text-ink-500 lg:hidden" @click="mobileNavOpen = true">
          <Icon icon="ph:list-bold" class="size-6" />
        </button>
        <p v-if="currentCrumb" class="text-sm text-ink-500 hidden sm:block">
          <span v-if="currentCrumb.section">{{ currentCrumb.section }}</span>
          <Icon v-if="currentCrumb.section" icon="ph:caret-right-bold" class="inline size-3 mx-1.5 -mt-0.5" />
          <span class="font-semibold text-ink-900">{{ currentCrumb.label }}</span>
        </p>
      <div class="ml-auto flex items-center gap-4"><span class="hidden md:block text-[11px] text-ink-500">GLOBAL SHIPPING GROUP</span><span class="h-7 w-px bg-ink-100 hidden md:block"></span><span class="rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-xs text-ink-700">Espace administration</span></div></header>

      <main class="admin-content flex-1 p-5 lg:p-9">
        <RouterView />
      </main>
    </div>
  </div>
</template>
