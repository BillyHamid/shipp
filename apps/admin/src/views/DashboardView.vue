<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface Kpis {
  byState: Record<string, number>
  totalParcels: number
  boxExpressCount: number
  boxCargoCount: number
}

const kpis = ref<Kpis | null>(null)
const year = ref(new Date().getFullYear())
const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

const chartData = ref({ labels: [] as string[], datasets: [] as any[] })
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const } },
  scales: { y: { beginAtZero: true } },
}

const STATE_COLORS: Record<string, string> = {
  registered: '#0ea5e9',
  in_transit: '#f59e0b',
  delivered: '#10b981',
  cancelled: '#ef4444',
}
const STATE_LABELS: Record<string, string> = {
  registered: 'Enregistrés',
  in_transit: 'En transit',
  delivered: 'Livrés',
  cancelled: 'Annulés',
}

async function loadKpis() {
  const res = await api.get<Kpis>('/dashboard/kpis')
  kpis.value = res.data
}

async function loadChart() {
  const res = await api.get('/dashboard/chart', { params: { year: year.value } })
  chartData.value = {
    labels: res.data.categories,
    datasets: res.data.series.map((s: { name: string; data: number[] }) => ({
      label: STATE_LABELS[s.name] ?? s.name,
      data: s.data,
      backgroundColor: STATE_COLORS[s.name] ?? '#94a3b8',
      borderRadius: 4,
    })),
  }
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
  { key: 'registered', label: 'Déposé', color: 'text-sky-600' },
  { key: 'in_transit', label: 'En transit', color: 'text-amber-600' },
  { key: 'arrived_country', label: 'Réceptionné', color: 'text-violet-600' },
  { key: 'delivered', label: 'Récupéré', color: 'text-emerald-600' },
  { key: 'cancelled', label: 'Annulé', color: 'text-red-600' },
]
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-slate-900">Tableau de bord</h1>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div v-for="c in cards" :key="c.key" class="card p-4">
        <p class="text-2xl font-bold" :class="c.color">{{ kpis?.byState[c.key] ?? '—' }}</p>
        <p class="text-xs text-slate-500 mt-1">{{ c.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card p-4">
        <p class="text-2xl font-bold text-slate-800">{{ kpis?.totalParcels ?? '—' }}</p>
        <p class="text-xs text-slate-500 mt-1">Total de colis</p>
      </div>
      <div class="card p-4">
        <p class="text-2xl font-bold text-slate-800">{{ kpis?.boxExpressCount ?? '—' }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase">Box Express</p>
      </div>
      <div class="card p-4">
        <p class="text-2xl font-bold text-slate-800">{{ kpis?.boxCargoCount ?? '—' }}</p>
        <p class="text-xs text-slate-500 mt-1 uppercase">Box Cargo</p>
      </div>
    </div>

    <!-- Chart -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-medium text-slate-700">Récapitulatif des activités</h2>
        <select v-model.number="year" class="input w-32" @change="loadChart">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="h-80">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
