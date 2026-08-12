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

const form = reactive({ accountId: '', type: 'inflow', label: '', amount: 0 })
const submitting = ref(false)

async function load() {
  const res = await api.get('/cash/operations', { params: { page: page.value, pageSize } })
  items.value = res.data.items
  total.value = res.data.total
}

async function loadAccounts() {
  const res = await api.get('/cash/accounts')
  accounts.value = res.data
  if (accounts.value[0]) form.accountId = accounts.value[0].id
}

async function createOperation() {
  submitting.value = true
  try {
    await api.post('/cash/operations', form)
    success('Opération enregistrée')
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
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Opérations de caisse</h1>
      <button class="btn-primary" @click="showCreate = true">+ Nouvelle opération</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Compte</th>
            <th class="table-header">Type</th>
            <th class="table-header">Libellé</th>
            <th class="table-header">Montant</th>
            <th class="table-header">Solde déb.</th>
            <th class="table-header">Solde fin.</th>
            <th class="table-header">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="7" class="table-cell text-center text-slate-400 py-8">Aucune opération</td>
          </tr>
          <tr v-for="op in items" :key="op.id" class="hover:bg-slate-50">
            <td class="table-cell font-mono text-xs">{{ op.account.code }}</td>
            <td class="table-cell">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="op.type === 'inflow' ? 'bg-emerald-50 text-emerald-700' : op.type === 'outflow' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ op.type === 'inflow' ? 'Entrée' : op.type === 'outflow' ? 'Sortie' : 'Transfert' }}
              </span>
            </td>
            <td class="table-cell">{{ op.label }}</td>
            <td class="table-cell font-medium">{{ formatMoney(op.amount, op.account.currency) }}</td>
            <td class="table-cell text-slate-500">{{ formatMoney(op.balanceBefore, op.account.currency) }}</td>
            <td class="table-cell text-slate-500">{{ formatMoney(op.balanceAfter, op.account.currency) }}</td>
            <td class="table-cell text-xs text-slate-500">{{ formatDateTime(op.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" @update:page="load" />
    </div>

    <Modal v-if="showCreate" title="Nouvelle opération" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Compte</label>
          <select v-model="form.accountId" class="input">
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.code }} — {{ a.label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Type</label>
          <select v-model="form.type" class="input">
            <option value="inflow">Entrée</option>
            <option value="outflow">Sortie</option>
            <option value="transfer">Transfert</option>
          </select>
        </div>
        <div>
          <label class="label">Libellé</label>
          <input v-model="form.label" class="input" placeholder="ex: Loyer bureau" />
        </div>
        <div>
          <label class="label">Montant</label>
          <input v-model.number="form.amount" type="number" step="0.01" class="input" />
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createOperation">
          {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>
