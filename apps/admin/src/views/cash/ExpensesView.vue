<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatDateTime, formatMoney } from '../../lib/format.js'
import Modal from '../../components/ui/Modal.vue'
import Pagination from '../../components/ui/Pagination.vue'

const { success, error: toastError } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const accounts = ref<any[]>([])
const showCreate = ref(false)

const form = reactive({ cashAccountId: '', label: '', amount: 0 })
const submitting = ref(false)

async function load() {
  const res = await api.get('/expenses', { params: { page: page.value, pageSize } })
  items.value = res.data.items
  total.value = res.data.total
}

async function loadAccounts() {
  const res = await api.get('/cash/accounts')
  accounts.value = res.data
  if (accounts.value[0]) form.cashAccountId = accounts.value[0].id
}

async function createExpense() {
  submitting.value = true
  try {
    await api.post('/expenses', form)
    success('Dépense enregistrée — répartie 50/50 entre les associés')
    showCreate.value = false
    form.label = ''
    form.amount = 0
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  load()
  loadAccounts()
})
</script>

<template>
  <div class="space-y-5">
    <div class="page-intro">
      <div><p class="eyebrow mb-2">Finance</p><h1 class="page-title">Dépenses</h1><p class="page-description">Centralisez les dépenses liées à vos opérations.</p></div>
      <button class="btn-primary" @click="showCreate = true">
        <Icon icon="ph:plus-bold" class="size-4" />
        Nouvelle dépense
      </button>
    </div>
    <p class="text-sm text-ink-500 -mt-3 flex items-center gap-1.5">
      <Icon icon="ph:info-bold" class="size-4 shrink-0" />
      Chaque dépense sort réellement d'une caisse et se répartit à 50/50 entre les deux associés.
    </p>

    <div class="card overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Caisse</th>
            <th class="table-header">Libellé</th>
            <th class="table-header">Montant</th>
            <th class="table-header">Posté par</th>
            <th class="table-header">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="5" class="table-cell text-center text-ink-300 py-10">
              <Icon icon="ph:receipt-bold" class="size-8 mx-auto mb-2 text-ink-200" />
              Aucune dépense
            </td>
          </tr>
          <tr v-for="e in items" :key="e.id" class="hover:bg-ink-50/60 transition-colors">
            <td class="table-cell font-mono text-xs">{{ e.cashAccount.code }}</td>
            <td class="table-cell">{{ e.label }}</td>
            <td class="table-cell font-medium text-ink-800">{{ formatMoney(e.amount, e.currency) }}</td>
            <td class="table-cell text-ink-500">{{ e.postedBy.fullName }}</td>
            <td class="table-cell text-xs text-ink-500">{{ formatDateTime(e.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" @update:page="load" />
    </div>

    <Modal v-if="showCreate" title="Nouvelle dépense" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Caisse (débitée)</label>
          <select v-model="form.cashAccountId" class="input">
            <option v-for="a in accounts" :key="a.id" :value="a.id">
              {{ a.code }} — {{ a.label }} ({{ a.currency }})
            </option>
          </select>
        </div>
        <div>
          <label class="label">Libellé</label>
          <input v-model="form.label" class="input" placeholder="ex: Dédouanement colis" />
        </div>
        <div>
          <label class="label">Montant</label>
          <input v-model.number="form.amount" type="number" step="0.01" class="input" />
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createExpense">
          {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>
