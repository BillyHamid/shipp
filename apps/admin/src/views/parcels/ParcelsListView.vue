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

async function load() {
  loading.value = true
  try {
    const res = await api.get('/parcels', {
      params: {
        query: query.value || undefined,
        state: stateFilter.value || undefined,
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
watch([query, stateFilter], () => {
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
      <h1 class="text-xl font-semibold text-slate-900">Colis</h1>
      <RouterLink :to="{ name: 'parcel-create' }" class="btn-primary">+ Nouveau colis</RouterLink>
    </div>

    <div class="flex gap-3 flex-wrap">
      <input v-model="query" placeholder="Rechercher (référence, nom...)" class="input max-w-xs" />
      <select v-model="stateFilter" class="input max-w-xs">
        <option v-for="[value, label] in STATES" :key="value" :value="value">{{ label }}</option>
      </select>
    </div>

    <div class="card overflow-hidden">
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
              <td colspan="8" class="table-cell text-center text-slate-400 py-8">Chargement...</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="8" class="table-cell text-center text-slate-400 py-8">Aucun colis trouvé</td>
            </tr>
            <tr
              v-for="p in items"
              :key="p.id"
              class="hover:bg-slate-50 cursor-pointer"
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
              <td class="table-cell"><StateBadge :state="p.paymentState" /></td>
              <td class="table-cell text-xs text-slate-500">{{ formatDateTime(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" />
    </div>
  </div>
</template>
