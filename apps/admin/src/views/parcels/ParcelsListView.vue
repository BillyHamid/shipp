<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../../lib/api.js'
import { formatDateTime, formatMoney } from '../../lib/format.js'
import StateBadge from '../../components/ui/StateBadge.vue'
import Pagination from '../../components/ui/Pagination.vue'

interface ParcelRow {
  id: string
  trackingNumber: string
  currentState: string
  paymentState: string
  paymentTiming: 'at_shipping' | 'at_arrival'
  weightKg: number
  priceUsd: number
  priceXof: number
  originCountry: string
  destCountry: string
  createdAt: string
  sender: { fullName: string }
  recipient: { fullName: string }
  box: { reference: string } | null
}

const items = ref<ParcelRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const query = ref('')
const stateFilter = ref('')
const paymentTimingFilter = ref('')
const loading = ref(false)

const STATES = [
  ['', 'Tous les états'],
  ['registered', 'Enregistré'],
  ['received_warehouse', 'Reçu entrepôt'],
  ['preparing', 'En préparation'],
  ['shipped', 'Expédié'],
  ['in_transit', 'En transit'],
  ['arrived_country', 'Arrivé pays'],
  ['customs', 'Dédouanement'],
  ['out_for_delivery', 'En livraison'],
  ['delivered', 'Livré'],
  ['cancelled', 'Annulé'],
]

const PAYMENT_TIMINGS = [
  ['', 'Envoi & arrivée'],
  ['at_shipping', "Paiement à l'envoi"],
  ['at_arrival', "Paiement à l'arrivée"],
]

async function load() {
  loading.value = true
  try {
    const res = await api.get('/parcels', {
      params: {
        query: query.value || undefined,
        state: stateFilter.value || undefined,
        paymentTiming: paymentTimingFilter.value || undefined,
        page: page.value,
        pageSize,
      },
    })
    items.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout>
watch([query, stateFilter, paymentTimingFilter], () => {
  page.value = 1
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(load, 300)
})
watch(page, load)

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div><p class="eyebrow mb-2">Logistique</p><h1 class="page-title">Colis</h1><p class="page-description">Suivez chaque colis, de son enregistrement à sa livraison.</p></div>
      <RouterLink :to="{ name: 'parcel-create' }" class="btn-primary">
        <Icon icon="ph:plus-bold" class="size-4" />
        Nouveau colis
      </RouterLink>
    </div>

    <div class="flex gap-3 flex-wrap">
      <div class="relative max-w-xs w-full">
        <Icon icon="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-300" />
        <input v-model="query" placeholder="Rechercher (référence, nom...)" class="input !pl-9" />
      </div>
      <select v-model="stateFilter" class="input max-w-xs">
        <option v-for="[value, label] in STATES" :key="value" :value="value">{{ label }}</option>
      </select>
      <select v-model="paymentTimingFilter" class="input max-w-xs">
        <option v-for="[value, label] in PAYMENT_TIMINGS" :key="value" :value="value">{{ label }}</option>
      </select>
    </div>

    <div class="card overflow-x-auto">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-header">Réf. colis</th>
              <th class="table-header">Expéditeur</th>
              <th class="table-header">Destinataire</th>
              <th class="table-header">Trajet</th>
              <th class="table-header">Montant</th>
              <th class="table-header">État</th>
              <th class="table-header">Paiement</th>
              <th class="table-header">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="table-cell text-center text-ink-300 py-10">
                <Icon icon="ph:spinner-gap-bold" class="size-5 animate-spin inline" />
              </td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="8" class="table-cell text-center text-ink-300 py-10">
                <Icon icon="ph:package-bold" class="size-8 mx-auto mb-2 text-ink-200" />
                Aucun colis trouvé
              </td>
            </tr>
            <tr
              v-for="p in items"
              :key="p.id"
              class="hover:bg-ink-50/60 cursor-pointer transition-colors"
              @click="$router.push({ name: 'parcel-detail', params: { id: p.id } })"
            >
              <td class="table-cell font-mono font-medium text-slate-800">{{ p.trackingNumber }}</td>
              <td class="table-cell">{{ p.sender.fullName }}</td>
              <td class="table-cell">{{ p.recipient.fullName }}</td>
              <td class="table-cell text-xs">{{ p.originCountry }} → {{ p.destCountry }}</td>
              <td class="table-cell">
                <div>{{ formatMoney(p.priceUsd, 'USD') }}</div>
                <div class="text-xs text-slate-400">{{ formatMoney(p.priceXof, 'XOF') }}</div>
              </td>
              <td class="table-cell"><StateBadge :state="p.currentState" /></td>
              <td class="table-cell">
                <StateBadge :state="p.paymentState" />
                <div class="flex items-center gap-1 text-[11px] text-ink-400 mt-1">
                  <Icon :icon="p.paymentTiming === 'at_arrival' ? 'ph:hand-coins-bold' : 'ph:package-bold'" class="size-3" />
                  {{ p.paymentTiming === 'at_arrival' ? "À l'arrivée" : "À l'envoi" }}
                </div>
              </td>
              <td class="table-cell text-xs text-slate-500">{{ formatDateTime(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" />
    </div>
  </div>
</template>
