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
  quantity: 1,
  weightKg: 1,
  declaredValue: null as number | null,
  declaredValueCurrency: 'USD',
  lengthCm: null as number | null,
  widthCm: null as number | null,
  heightCm: null as number | null,
  isFragile: false,
  originCountry: 'US',
  destCountry: 'BF',
  paymentTiming: 'at_shipping' as 'at_shipping' | 'at_arrival',
})

const PAYMENT_TIMINGS = [
  { value: 'at_shipping' as const, label: "À l'envoi", icon: 'ph:package-bold', hint: 'Le client paie au dépôt du colis' },
  { value: 'at_arrival' as const, label: "À l'arrivée", icon: 'ph:hand-coins-bold', hint: 'Le client paie à la récupération' },
]

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
  if (form.description.trim().length < 2) {
    toastError('Indiquez clairement le contenu du colis')
    return
  }
  submitting.value = true
  try {
    const res = await api.post('/parcels', {
      senderId: selectedSender.value.id,
      recipientId: selectedRecipient.value.id,
      category: form.category,
      description: form.description.trim(),
      quantity: form.quantity,
      weightKg: form.weightKg,
      declaredValue: form.declaredValue || undefined,
      declaredValueCurrency: form.declaredValue ? form.declaredValueCurrency : undefined,
      lengthCm: form.lengthCm || undefined,
      widthCm: form.widthCm || undefined,
      heightCm: form.heightCm || undefined,
      isFragile: form.isFragile,
      originCountry: form.originCountry,
      destCountry: form.destCountry,
      paymentTiming: form.paymentTiming,
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
    <div><p class="eyebrow mb-2">Nouvelle expédition</p><h1 class="page-title">Nouveau colis</h1><p class="page-description">Renseignez les contacts et les caractéristiques du colis.</p></div>

    <div class="card p-5 space-y-5">
      <!-- Sender -->
      <div class="relative">
        <label class="label">Expéditeur</label>
        <div class="relative">
          <input v-model="senderQuery" class="input !pr-9" placeholder="Rechercher un client..." />
          <Icon
            v-if="selectedSender && senderQuery === selectedSender.fullName"
            icon="ph:check-circle-fill"
            class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500"
          />
        </div>
        <ul v-if="senderResults.length" class="absolute z-10 w-full bg-white border border-ink-100 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
          <li
            v-for="c in senderResults"
            :key="c.id"
            class="px-3 py-2 text-sm hover:bg-ink-50 cursor-pointer transition-colors"
            @click="pickSender(c)"
          >
            {{ c.fullName }} · {{ c.phone }}
          </li>
        </ul>
      </div>

      <!-- Recipient -->
      <div class="relative">
        <label class="label">Destinataire</label>
        <div class="relative">
          <input v-model="recipientQuery" class="input !pr-9" placeholder="Rechercher un client..." />
          <Icon
            v-if="selectedRecipient && recipientQuery === selectedRecipient.fullName"
            icon="ph:check-circle-fill"
            class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500"
          />
        </div>
        <ul v-if="recipientResults.length" class="absolute z-10 w-full bg-white border border-ink-100 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
          <li
            v-for="c in recipientResults"
            :key="c.id"
            class="px-3 py-2 text-sm hover:bg-ink-50 cursor-pointer transition-colors"
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
        <label class="label">Contenu du colis <span class="text-brand-600">*</span></label>
        <input v-model="form.description" class="input" required placeholder="Ex : 2 paires de chaussures Nike" />
        <p class="mt-1.5 text-xs text-ink-400">Ce libellé figurera sur le reçu et facilite le contrôle à l'arrivée.</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Quantité <span class="text-brand-600">*</span></label>
          <input v-model.number="form.quantity" type="number" min="1" max="999" step="1" class="input" />
        </div>
        <div>
          <label class="label">Valeur déclarée</label>
          <div class="flex gap-2">
            <input v-model.number="form.declaredValue" type="number" min="0" step="0.01" class="input min-w-0" placeholder="0,00" />
            <select v-model="form.declaredValueCurrency" class="input w-24 shrink-0">
              <option value="USD">USD</option>
              <option value="XOF">FCFA</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-ink-100 bg-ink-50/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-ink-800">Dimensions et manutention</p>
            <p class="text-xs text-ink-400 mt-0.5">Recommandées pour les colis volumineux, fragiles ou hors format.</p>
          </div>
          <label class="inline-flex items-center gap-2 text-sm font-medium text-ink-700 cursor-pointer select-none">
            <input v-model="form.isFragile" type="checkbox" class="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            Fragile
          </label>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="label !mb-1">Longueur (cm)</label><input v-model.number="form.lengthCm" type="number" min="0.1" step="0.1" class="input" placeholder="—" /></div>
          <div><label class="label !mb-1">Largeur (cm)</label><input v-model.number="form.widthCm" type="number" min="0.1" step="0.1" class="input" placeholder="—" /></div>
          <div><label class="label !mb-1">Hauteur (cm)</label><input v-model.number="form.heightCm" type="number" min="0.1" step="0.1" class="input" placeholder="—" /></div>
        </div>
      </div>

      <div>
        <label class="label">Type de paiement</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="t in PAYMENT_TIMINGS"
            :key="t.value"
            type="button"
            class="text-left rounded-xl border p-3 transition-colors"
            :class="form.paymentTiming === t.value ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:bg-ink-50'"
            @click="form.paymentTiming = t.value"
          >
            <div class="flex items-center gap-2">
              <Icon :icon="t.icon" class="size-4" :class="form.paymentTiming === t.value ? 'text-brand-600' : 'text-ink-400'" />
              <span class="text-sm font-semibold" :class="form.paymentTiming === t.value ? 'text-brand-800' : 'text-ink-700'">{{ t.label }}</span>
            </div>
            <p class="text-xs text-ink-400 mt-1">{{ t.hint }}</p>
          </button>
        </div>
      </div>

      <div v-if="quote" class="rounded-xl bg-brand-50 border border-brand-100 p-4 flex items-center justify-between">
        <span class="text-sm text-brand-700 flex items-center gap-1.5">
          <Icon icon="ph:calculator-bold" class="size-4" />
          Prix estimé
        </span>
        <span class="font-display font-bold text-brand-800 tabular-nums">
          {{ formatMoney(quote.priceUsd, 'USD') }} · {{ formatMoney(quote.priceXof, 'XOF') }}
        </span>
      </div>

      <button class="btn-primary w-full" :disabled="submitting" @click="submit">
        <Icon v-if="submitting" icon="ph:spinner-gap-bold" class="size-4 animate-spin" />
        <Icon v-else icon="ph:package-bold" class="size-4" />
        {{ submitting ? 'Création...' : 'Créer le colis' }}
      </button>
    </div>
  </div>
</template>
