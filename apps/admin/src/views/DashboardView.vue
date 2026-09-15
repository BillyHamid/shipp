<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { api } from '../lib/api.js'
import { getAdminSocket } from '../lib/socket.js'
import { useAuthStore } from '../stores/auth.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const auth = useAuthStore()

interface Kpis {
  byState: Record<string, number>
  totalParcels: number
  boxExpressCount: number
  boxCargoCount: number
}

const kpis = ref<Kpis | null>(null)
const loadError = ref(false)
const activeCount = computed(() => kpis.value ? Object.entries(kpis.value.byState).reduce((sum, [state, n]) => sum + (['delivered', 'cancelled'].includes(state) ? 0 : n), 0) : null)
const year = ref(new Date().getFullYear())
const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

const chartData = ref({ labels: [] as string[], datasets: [] as any[] })
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter' } } } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false } },
  },
}

const STATE_COLORS: Record<string, string> = {
  registered: '#e5484d',
  in_transit: '#d6924d',
  delivered: '#4b9a7c',
  cancelled: '#ef4444',
}
const STATE_LABELS: Record<string, string> = {
  registered: 'Enregistrés',
  in_transit: 'En transit',
  delivered: 'Livrés',
  cancelled: 'Annulés',
}

async function loadKpis() {
  try {
    const res = await api.get<Kpis>('/dashboard/kpis')
    kpis.value = res.data
    loadError.value = false
  } catch { loadError.value = true }
}

async function loadChart() {
  try {
  const res = await api.get('/dashboard/chart', { params: { year: year.value } })
  chartData.value = {
    labels: res.data.categories,
    datasets: res.data.series.map((s: { name: string; data: number[] }) => ({
      label: STATE_LABELS[s.name] ?? s.name,
      data: s.data,
      backgroundColor: STATE_COLORS[s.name] ?? '#94a3b8',
      borderRadius: 6,
      maxBarThickness: 18,
    })),
  }
  } catch { loadError.value = true }
}

const socket = getAdminSocket()
function onInvalidate() {
  loadKpis()
  loadChart()
}

onMounted(() => {
  loadKpis()
  loadChart()
  socket.on('dashboard:invalidate', onInvalidate)
})
onBeforeUnmount(() => socket.off('dashboard:invalidate', onInvalidate))

const cards = [
  { key: 'registered', label: 'Déposé', icon: 'ph:package-bold', color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'in_transit', label: 'En transit', icon: 'ph:airplane-tilt-bold', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'arrived_country', label: 'Réceptionné', icon: 'ph:map-pin-bold', color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'delivered', label: 'Récupéré', icon: 'ph:check-circle-bold', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'cancelled', label: 'Annulé', icon: 'ph:x-circle-bold', color: 'text-red-600', bg: 'bg-red-50' },
]

const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
</script>

<template>
  <div class="space-y-7">
    <div class="page-intro dashboard-intro reveal">
      <div><p class="eyebrow mb-3">Vue d’ensemble · {{ today }}</p><h1 class="page-title">Chaque expédition, sous contrôle.</h1><p class="page-description">{{ greeting }}, {{ auth.user?.fullName?.split(' ')[0] }}. Voici l’activité de votre réseau.</p></div>
      <RouterLink v-if="auth.can('parcels.create')" to="/parcels/new" class="btn-primary"><Icon icon="ph:plus-bold" class="size-4" /> Nouveau colis</RouterLink>
    </div>
    <div v-if="loadError" role="alert" class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex items-center justify-between gap-3">Certaines données n’ont pas pu être chargées.<button class="underline font-semibold" @click="onInvalidate">Réessayer</button></div>
    <section class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 reveal reveal-1">
      <div class="card dashboard-portfolio p-6 sm:p-7">
        <div class="flex justify-between items-center"><p class="eyebrow">Portefeuille logistique</p><Icon icon="ph:stack" class="size-5 text-rose-400" /></div>
        <div class="grid grid-cols-3 mt-7 divide-x divide-ink-100">
          <div class="pr-3"><p class="metric-number text-ink-900">{{ kpis?.totalParcels ?? '—' }}</p><p class="text-xs text-ink-500 mt-2">Colis enregistrés</p></div>
          <div class="px-4 sm:px-7"><p class="metric-number text-ink-900">{{ activeCount ?? '—' }}</p><p class="text-xs text-ink-500 mt-2">En cours de traitement</p></div>
          <div class="pl-4 sm:pl-7"><p class="metric-number text-rose-700">{{ kpis?.byState.delivered ?? '—' }}</p><p class="text-xs text-ink-500 mt-2">Colis livrés</p></div>
        </div>
        <div class="mt-7 pt-4 border-t border-ink-100 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-500"><span><strong class="text-ink-700">{{ kpis?.boxExpressCount ?? '—' }}</strong> boxes Express</span><span><strong class="text-ink-700">{{ kpis?.boxCargoCount ?? '—' }}</strong> boxes Cargo</span><span class="ml-auto">Tous les colis</span></div>
      </div>
      <div class="route-panel rounded-2xl p-6 flex flex-col justify-between min-h-52">
        <p class="text-[10px] uppercase tracking-[.2em] text-rose-200">Une liaison. Deux continents.</p>
        <div class="flex items-center justify-between my-6"><div><p class="text-3xl font-bold tracking-tight">USA</p><p class="text-xs text-slate-300 mt-1">États-Unis</p></div><div class="flex-1 mx-5 border-t border-dashed border-white/30 text-center"><Icon icon="ph:airplane-tilt" class="size-6 -mt-3 mx-auto text-rose-200 route-plane" /></div><div><p class="text-3xl font-bold tracking-tight">BFA</p><p class="text-xs text-slate-300 mt-1">Burkina Faso</p></div></div>
        <RouterLink v-if="auth.can('boxes.read')" to="/boxes" class="text-xs text-rose-100 flex items-center justify-between border-t border-white/15 pt-4">Gérer les expéditions <Icon icon="ph:arrow-up-right" class="size-4" /></RouterLink>
      </div>
    </section>
    <section class="reveal reveal-2">
      <div class="flex items-center justify-between mb-3"><h2 class="text-sm font-bold text-ink-900">Suivi des opérations</h2><span class="text-xs text-ink-500">Répartition par statut</span></div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3"><div v-for="c in cards" :key="c.key" class="card p-4"><div class="flex items-center justify-between mb-5"><span class="text-xs text-ink-500">{{ c.label }}</span><Icon :icon="c.icon" class="size-[18px]" :class="c.color" /></div><p class="text-2xl font-bold text-ink-900 tabular-nums">{{ kpis?.byState[c.key] ?? '—' }}</p><div class="mt-3 h-1 rounded-full" :class="c.bg"></div></div></div>
    </section>
    <section class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 reveal reveal-3">
      <div class="card dashboard-chart p-5 sm:p-6 min-w-0"><div class="flex items-center justify-between gap-3 mb-6"><div><h2 class="font-bold text-ink-900">Évolution de l’activité</h2><p class="text-xs text-ink-500 mt-1">Répartition mensuelle des colis</p></div><select aria-label="Année du graphique" v-model.number="year" class="input !w-24" @change="loadChart"><option v-for="y in years" :key="y" :value="y">{{ y }}</option></select></div><div class="h-64"><Bar :data="chartData" :options="chartOptions" /></div></div>
      <div class="card quick-access p-6"><p class="eyebrow mb-3">Votre espace de travail</p><h2 class="font-bold text-ink-900 mb-5">Accès rapides</h2><RouterLink v-for="link in [{ to: '/parcels', label: 'Consulter les colis', sub: 'Suivi et historique', icon: 'ph:package', perm: 'parcels.read' }, { to: '/customers', label: 'Répertoire clients', sub: 'Expéditeurs et destinataires', icon: 'ph:users', perm: 'customers.read' }, { to: '/cash/accounts', label: 'Comptes de caisse', sub: 'Soldes et encaissements', icon: 'ph:wallet', perm: 'cash.read' }].filter(l => auth.can(l.perm))" :key="link.to" :to="link.to" class="flex items-center gap-3 py-4 border-t border-ink-100 group"><div class="size-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600"><Icon :icon="link.icon" class="size-5" /></div><div class="flex-1"><p class="text-xs font-semibold text-ink-700 group-hover:text-rose-700">{{ link.label }}</p><p class="text-[11px] text-ink-500 mt-1">{{ link.sub }}</p></div><Icon icon="ph:caret-right" class="size-3 text-ink-300" /></RouterLink><p class="mt-6 text-[11px] leading-relaxed text-ink-500">Les informations se mettent à jour au fil des opérations de votre équipe.</p></div>
    </section>
  </div>
</template>
