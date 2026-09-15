<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatMoney } from '../../lib/format.js'
import Modal from '../../components/ui/Modal.vue'
import { COUNTRY_OPTIONS, countryLabel } from '../../lib/countries.js'

const { success, error: toastError } = useToast()

const CATEGORIES = [
  ['PHONE', 'Téléphone'], ['ELECTRONICS', 'Électronique'], ['COMPUTER', 'Ordinateur'],
  ['COSMETICS', 'Cosmétique'], ['FOOD', 'Alimentaire'], ['CLOTHING', 'Vêtements'],
  ['DOCUMENTS', 'Documents'], ['OTHER', 'Autres'],
]

const items = ref<any[]>([])
const showCreate = ref(false)
const form = reactive({
  label: '', category: 'OTHER', originCountry: 'US', destCountry: 'BF',
  basePriceUsd: 15, perKgUsd: 12,
})
const submitting = ref(false)

async function load() {
  const res = await api.get('/pricing')
  items.value = res.data
}

async function createRule() {
  submitting.value = true
  try {
    await api.post('/pricing', form)
    success('Tarif créé')
    showCreate.value = false
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  } finally {
    submitting.value = false
  }
}

async function deactivate(id: string) {
  try {
    await api.post(`/pricing/${id}/deactivate`)
    success('Tarif désactivé')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="page-intro">
      <div><p class="eyebrow mb-2">Configuration</p><h1 class="page-title">Tarifs</h1><p class="page-description">Définissez les règles de tarification de vos expéditions.</p></div>
      <button class="btn-primary" @click="showCreate = true">
        <Icon icon="ph:plus-bold" class="size-4" />
        Nouveau tarif
      </button>
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Libellé</th>
            <th class="table-header">Catégorie</th>
            <th class="table-header">Trajet</th>
            <th class="table-header">Forfait</th>
            <th class="table-header">Par kg</th>
            <th class="table-header">Statut</th>
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="7" class="table-cell text-center text-ink-300 py-10">
              <Icon icon="ph:tag-bold" class="size-8 mx-auto mb-2 text-ink-200" />
              Aucun tarif
            </td>
          </tr>
          <tr v-for="r in items" :key="r.id" class="hover:bg-ink-50/60 transition-colors">
            <td class="table-cell font-medium text-ink-800">{{ r.label }}</td>
            <td class="table-cell">{{ r.category }}</td>
            <td class="table-cell text-xs">{{ countryLabel(r.originCountry) }} → {{ countryLabel(r.destCountry) }}</td>
            <td class="table-cell">{{ formatMoney(r.basePriceUsd, 'USD') }}</td>
            <td class="table-cell">{{ formatMoney(r.perKgUsd, 'USD') }}/kg</td>
            <td class="table-cell">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'">
                {{ r.active ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="table-cell">
              <button v-if="r.active" class="text-red-600 text-sm font-medium hover:underline" @click="deactivate(r.id)">Désactiver</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showCreate" title="Nouveau tarif" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Libellé</label>
          <input v-model="form.label" class="input" placeholder="ex: Ordinateur USA → BF" />
        </div>
        <div>
          <label class="label">Catégorie</label>
          <select v-model="form.category" class="input">
            <option v-for="[value, label] in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Pays origine</label>
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
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Forfait de base ($)</label>
            <input v-model.number="form.basePriceUsd" type="number" step="0.01" class="input" />
          </div>
          <div>
            <label class="label">Prix par kg ($)</label>
            <input v-model.number="form.perKgUsd" type="number" step="0.01" class="input" />
          </div>
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createRule">
          {{ submitting ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>
