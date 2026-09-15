<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatMoney } from '../../lib/format.js'
import Modal from '../../components/ui/Modal.vue'
import Pagination from '../../components/ui/Pagination.vue'
import { COUNTRY_OPTIONS, countryLabel } from '../../lib/countries.js'

const { success, error: toastError } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const query = ref('')
const showCreate = ref(false)
const showHistory = ref<any>(null)

const form = reactive({ fullName: '', phone: '', email: '', country: 'BF', address: '' })
const submitting = ref(false)

async function load() {
  const res = await api.get('/customers', { params: { query: query.value || undefined, page: page.value, pageSize } })
  items.value = res.data.items
  total.value = res.data.total
}

let debounce: ReturnType<typeof setTimeout>
watch(query, () => {
  page.value = 1
  clearTimeout(debounce)
  debounce = setTimeout(load, 300)
})
watch(page, load)

async function createCustomer() {
  submitting.value = true
  try {
    await api.post('/customers', {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email || undefined,
      country: form.country,
      address: form.address || undefined,
    })
    success('Client créé')
    showCreate.value = false
    Object.assign(form, { fullName: '', phone: '', email: '', country: 'BF', address: '' })
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  } finally {
    submitting.value = false
  }
}

async function openHistory(id: string) {
  const res = await api.get(`/customers/${id}/history`)
  showHistory.value = res.data
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div><p class="eyebrow mb-2">Relations clients</p><h1 class="page-title">Clients</h1><p class="page-description">Retrouvez vos expéditeurs, destinataires et leurs historiques.</p></div>
      <button class="btn-primary" @click="showCreate = true">
        <Icon icon="ph:plus-bold" class="size-4" />
        Nouveau client
      </button>
    </div>

    <div class="relative max-w-sm">
      <Icon icon="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-300" />
      <input v-model="query" placeholder="Rechercher (nom, téléphone, email)..." class="input !pl-9" />
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Nom</th>
            <th class="table-header">Téléphone</th>
            <th class="table-header">Pays</th>
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="4" class="table-cell text-center text-ink-300 py-10">
              <Icon icon="ph:users-bold" class="size-8 mx-auto mb-2 text-ink-200" />
              Aucun client
            </td>
          </tr>
          <tr v-for="c in items" :key="c.id" class="hover:bg-ink-50/60 transition-colors">
            <td class="table-cell font-medium text-ink-800">{{ c.fullName }}</td>
            <td class="table-cell">{{ c.phone }}</td>
            <td class="table-cell">{{ countryLabel(c.country) }}</td>
            <td class="table-cell">
              <button class="inline-flex items-center gap-1 text-brand-600 text-sm font-medium hover:text-brand-700" @click="openHistory(c.id)">
                <Icon icon="ph:clock-counter-clockwise-bold" class="size-4" />
                Historique
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" />
    </div>

    <Modal v-if="showCreate" title="Nouveau client" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Nom complet</label>
          <input v-model="form.fullName" class="input" placeholder="ex: John Smith" />
        </div>
        <div>
          <label class="label">Téléphone</label>
          <input v-model="form.phone" class="input" placeholder="ex: 57804855" />
        </div>
        <div>
          <label class="label">Pays</label>
          <select v-model="form.country" class="input">
            <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Email (optionnel)</label>
          <input v-model="form.email" type="email" class="input" />
        </div>
        <div>
          <label class="label">Adresse (optionnel)</label>
          <input v-model="form.address" class="input" />
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createCustomer">
          {{ submitting ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </Modal>

    <Modal v-if="showHistory" title="Historique client" @close="showHistory = null">
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <p class="text-lg font-bold text-slate-800">{{ showHistory.parcelCount }}</p>
            <p class="text-xs text-slate-500">Colis</p>
          </div>
          <div>
            <p class="text-lg font-bold text-slate-800">{{ formatMoney(showHistory.totalUsd, 'USD') }}</p>
            <p class="text-xs text-slate-500">Total USD</p>
          </div>
          <div>
            <p class="text-lg font-bold text-slate-800">{{ formatMoney(showHistory.totalXof, 'XOF') }}</p>
            <p class="text-xs text-slate-500">Total XOF</p>
          </div>
        </div>
        <ul class="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          <li v-for="p in showHistory.parcels" :key="p.id" class="py-2 text-sm flex justify-between">
            <span class="font-mono">{{ p.trackingNumber }}</span>
            <span class="text-slate-500">{{ p.currentState }}</span>
          </li>
        </ul>
      </div>
    </Modal>
  </div>
</template>
