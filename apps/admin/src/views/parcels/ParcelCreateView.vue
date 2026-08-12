<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatMoney } from '../../lib/format.js'
import { COUNTRY_OPTIONS } from '../../lib/countries.js'

const router = useRouter()
const { success, error: toastError } = useToast()

const CATEGORIES = [
  ['PHONE', 'Téléphone'],
  ['ELECTRONICS', 'Électronique'],
  ['COMPUTER', 'Ordinateur'],
  ['COSMETICS', 'Cosmétique'],
  ['FOOD', 'Alimentaire'],
  ['CLOTHING', 'Vêtements'],
  ['DOCUMENTS', 'Documents'],
  ['OTHER', 'Autres'],
]

interface CustomerLite {
  id: string
  fullName: string
  phone: string
  country: string
}

const senderQuery = ref('')
const recipientQuery = ref('')
const senderResults = ref<CustomerLite[]>([])
const recipientResults = ref<CustomerLite[]>([])
const selectedSender = ref<CustomerLite | null>(null)
const selectedRecipient = ref<CustomerLite | null>(null)

const form = reactive({
  category: 'OTHER',
  description: '',
  weightKg: 1,
  declaredValue: null as number | null,
  originCountry: 'US',
  destCountry: 'BF',
})

const quote = ref<{ priceUsd: number; priceXof: number } | null>(null)
const submitting = ref(false)

async function searchCustomers(q: string, target: 'sender' | 'recipient') {
  if (q.length < 2) return
  const res = await api.get('/customers', { params: { query: q, pageSize: 5 } })
  if (target === 'sender') senderResults.value = res.data.items
  else recipientResults.value = res.data.items
}

watch(senderQuery, (q) => searchCustomers(q, 'sender'))
watch(recipientQuery, (q) => searchCustomers(q, 'recipient'))

function pickSender(c: CustomerLite) {
  selectedSender.value = c
  senderQuery.value = c.fullName
  senderResults.value = []
}
function pickRecipient(c: CustomerLite) {
  selectedRecipient.value = c
  recipientQuery.value = c.fullName
  recipientResults.value = []
}

async function refreshQuote() {
  if (!form.weightKg || form.weightKg <= 0) return
  const res = await api.post('/pricing/quote', {
    category: form.category,
    weightKg: form.weightKg,
    originCountry: form.originCountry,
    destCountry: form.destCountry,
  })
  quote.value = res.data
}
watch(() => [form.category, form.weightKg, form.originCountry, form.destCountry], refreshQuote, { immediate: true })

async function submit() {
  if (!selectedSender.value || !selectedRecipient.value) {
    toastError('Sélectionnez un expéditeur et un destinataire')
    return
  }
  submitting.value = true
  try {
    const res = await api.post('/parcels', {
      senderId: selectedSender.value.id,
      recipientId: selectedRecipient.value.id,
      category: form.category,
      description: form.description || undefined,
      weightKg: form.weightKg,
      declaredValue: form.declaredValue || undefined,
      originCountry: form.originCountry,
      destCountry: form.destCountry,
    })
    success('Colis créé')
    router.push({ name: 'parcel-detail', params: { id: res.data.id } })
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur lors de la création')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-xl font-semibold text-slate-900">Nouveau colis</h1>

    <div class="card p-5 space-y-5">
      <!-- Sender -->
      <div class="relative">
        <label class="label">Expéditeur</label>
        <input v-model="senderQuery" class="input" placeholder="Rechercher un client..." />
        <ul v-if="senderResults.length" class="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
          <li
            v-for="c in senderResults"
            :key="c.id"
            class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
            @click="pickSender(c)"
          >
            {{ c.fullName }} · {{ c.phone }}
          </li>
        </ul>
      </div>

      <!-- Recipient -->
      <div class="relative">
        <label class="label">Destinataire</label>
        <input v-model="recipientQuery" class="input" placeholder="Rechercher un client..." />
        <ul v-if="recipientResults.length" class="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
          <li
            v-for="c in recipientResults"
            :key="c.id"
            class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
            @click="pickRecipient(c)"
          >
            {{ c.fullName }} · {{ c.phone }}
          </li>
        </ul>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Pays d'expédition</label>
          <select v-model="form.originCountry" class="input">
            <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Pays de destination</label>
          <select v-model="form.destCountry" class="input">
            <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Catégorie</label>
          <select v-model="form.category" class="input">
            <option v-for="[value, label] in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Poids (kg)</label>
          <input v-model.number="form.weightKg" type="number" step="0.1" min="0.1" class="input" />
        </div>
      </div>

      <div>
        <label class="label">Description (optionnel)</label>
        <input v-model="form.description" class="input" placeholder="Ex: iPhone 15, vêtements..." />
      </div>

      <div v-if="quote" class="rounded-lg bg-brand-50 border border-brand-100 p-4 flex items-center justify-between">
        <span class="text-sm text-brand-700">Prix estimé</span>
        <span class="font-semibold text-brand-800">
          {{ formatMoney(quote.priceUsd, 'USD') }} · {{ formatMoney(quote.priceXof, 'XOF') }}
        </span>
      </div>

      <button class="btn-primary w-full" :disabled="submitting" @click="submit">
        {{ submitting ? 'Création...' : 'Créer le colis' }}
      </button>
    </div>
  </div>
</template>
