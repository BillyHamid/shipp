<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../../lib/api.js'
import { formatMoney, formatDateTime } from '../../lib/format.js'

interface PartnerSummary { partnerId: string; code: string; label: string; byCurrency: Partial<Record<'USD' | 'XOF', { net: number; revenue: number; expense: number }>> }
const summary = ref<PartnerSummary[]>([])
const shares = ref<any[]>([])
const loading = ref(true)
const range = ref<'week' | 'month' | 'all'>('month')
const RANGE_OPTIONS: Array<{ value: 'week' | 'month' | 'all'; label: string }> = [
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: 'all', label: 'Tout' },
]

function rangeDates(): { dateFrom?: string } {
  const now = new Date()
  if (range.value === 'week') {
    const from = new Date(now)
    from.setDate(now.getDate() - 7)
    return { dateFrom: from.toISOString() }
  }
  if (range.value === 'month') {
    const from = new Date(now)
    from.setMonth(now.getMonth() - 1)
    return { dateFrom: from.toISOString() }
  }
  return {}
}

async function load() {
  loading.value = true
  const params = rangeDates()
  const [sRes, shRes] = await Promise.all([
    api.get('/partners/summary', { params }),
    api.get('/partners/shares', { params: { ...params, pageSize: 30 } }),
  ])
  summary.value = sRes.data
  shares.value = shRes.data.items
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h1 class="text-2xl font-display font-extrabold text-ink-900">Associés</h1>
      <div class="flex gap-2">
        <button
          v-for="r in RANGE_OPTIONS"
          :key="r.value"
          class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          :class="range === r.value ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'"
          @click="range = r.value; load()"
        >
          {{ r.label }}
        </button>
      </div>
    </div>
    <p class="text-sm text-ink-500 -mt-3">
      Part de chaque associé : 50% des revenus (paiements colis) moins 50% des dépenses postées.
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <Icon icon="ph:spinner-gap-bold" class="size-6 animate-spin text-ink-300" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="p in summary" :key="p.partnerId" class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="size-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Icon icon="ph:handshake-bold" class="size-5 text-violet-600" />
          </div>
          <span class="text-xs font-mono text-ink-400">{{ p.code }}</span>
        </div>
        <p class="font-medium text-ink-800 mb-3">{{ p.label }}</p>

        <div v-if="Object.keys(p.byCurrency).length === 0" class="text-sm text-ink-300">
          Aucun mouvement sur cette période
        </div>
        <div v-for="(v, currency) in p.byCurrency" :key="currency" class="mb-3 last:mb-0">
          <p class="text-2xl font-display font-extrabold tabular-nums" :class="v!.net >= 0 ? 'text-emerald-600' : 'text-red-600'">
            {{ formatMoney(v!.net, currency) }}
          </p>
          <p class="text-xs text-ink-400">
            + {{ formatMoney(v!.revenue, currency) }} revenus
            − {{ formatMoney(v!.expense, currency) }} dépenses
          </p>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-ink-50 font-display font-bold text-ink-900">Détail des mouvements</div>
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Associé</th>
            <th class="table-header">Type</th>
            <th class="table-header">Libellé</th>
            <th class="table-header">Part (50%)</th>
            <th class="table-header">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="shares.length === 0">
            <td colspan="5" class="table-cell text-center text-ink-300 py-10">Aucun mouvement</td>
          </tr>
          <tr v-for="s in shares" :key="s.id" class="hover:bg-ink-50/60 transition-colors">
            <td class="table-cell font-mono text-xs">{{ s.partner.code }}</td>
            <td class="table-cell">
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                :class="s.type === 'revenue' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
              >
                {{ s.type === 'revenue' ? 'Revenu' : 'Dépense' }}
              </span>
            </td>
            <td class="table-cell">{{ s.label }}</td>
            <td class="table-cell font-medium text-ink-800">{{ formatMoney(s.amount, s.currency) }}</td>
            <td class="table-cell text-xs text-ink-500">{{ formatDateTime(s.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

