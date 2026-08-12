<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatDate } from '../../lib/format.js'
import StateBadge from '../../components/ui/StateBadge.vue'
import Modal from '../../components/ui/Modal.vue'
import Pagination from '../../components/ui/Pagination.vue'
import { COUNTRY_OPTIONS } from '../../lib/countries.js'

const router = useRouter()
const { success, error: toastError } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const showCreate = ref(false)

const form = reactive({ type: 'EXPRESS', capacityKg: 32, originCountry: 'US', destCountry: 'BF' })
const submitting = ref(false)

async function load() {
  const res = await api.get('/boxes', { params: { page: page.value, pageSize } })
  items.value = res.data.items
  total.value = res.data.total
}

async function createBox() {
  submitting.value = true
  try {
    const res = await api.post('/boxes', form)
    success('BOX créée')
    showCreate.value = false
    router.push({ name: 'box-detail', params: { id: res.data.id } })
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">BOX</h1>
      <button class="btn-primary" @click="showCreate = true">+ Nouvelle BOX</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Référence</th>
            <th class="table-header">Type</th>
            <th class="table-header">Trajet</th>
            <th class="table-header">Capacité</th>
            <th class="table-header">Colis</th>
            <th class="table-header">État</th>
            <th class="table-header">Créée le</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in items"
            :key="b.id"
            class="hover:bg-slate-50 cursor-pointer"
            @click="router.push({ name: 'box-detail', params: { id: b.id } })"
          >
            <td class="table-cell font-mono font-medium">{{ b.reference }}</td>
            <td class="table-cell">{{ b.type }}</td>
            <td class="table-cell text-xs">{{ b.originCountry }} → {{ b.destCountry }}</td>
            <td class="table-cell">{{ b.capacityKg }} kg</td>
            <td class="table-cell">{{ b._count?.parcels ?? 0 }}</td>
            <td class="table-cell"><StateBadge :state="b.status" /></td>
            <td class="table-cell text-xs text-slate-500">{{ formatDate(b.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <Pagination v-model:page="page" :page-size="pageSize" :total="total" @update:page="load" />
    </div>

    <Modal v-if="showCreate" title="Nouvelle BOX" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Type</label>
          <select v-model="form.type" class="input">
            <option value="EXPRESS">EXPRESS</option>
            <option value="CARGO">CARGO</option>
          </select>
        </div>
        <div>
          <label class="label">Capacité (kg)</label>
          <input v-model.number="form.capacityKg" type="number" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Pays d'origine</label>
            <select v-model="form.originCountry" class="input">
              <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Pays destination</label>
            <select v-model="form.destCountry" class="input">
              <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
            </select>
          </div>
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createBox">
          {{ submitting ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>
