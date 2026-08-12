<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatDate, formatMoney } from '../../lib/format.js'
import { ACTION_LABELS } from '../../lib/action-labels.js'
import StateBadge from '../../components/ui/StateBadge.vue'
import Modal from '../../components/ui/Modal.vue'
import ParcelTimeline from '../../components/parcels/ParcelTimeline.vue'
import NotifyCustomerButtons from '../../components/parcels/NotifyCustomerButtons.vue'

const props = defineProps<{ id: string }>()
const { success, error: toastError } = useToast()

const parcel = ref<any>(null)
const events = ref<any[]>([])
const allowedActions = ref<string[]>([])
const loading = ref(true)
const pendingAction = ref<string | null>(null)
const cancelReason = ref('')

async function load() {
  loading.value = true
  const [pRes, eRes, aRes] = await Promise.all([
    api.get(`/parcels/${props.id}`),
    api.get(`/parcels/${props.id}/events`),
    api.get(`/parcels/${props.id}/allowed-actions`),
  ])
  parcel.value = pRes.data
  events.value = eRes.data
  allowedActions.value = aRes.data.actions
  loading.value = false
}

async function confirmAction() {
  if (!pendingAction.value) return
  const action = pendingAction.value
  try {
    const metadata: Record<string, unknown> = {}
    if (action === 'cancel') metadata.reason = cancelReason.value
    await api.post(`/parcels/${props.id}/transitions`, { action, metadata })
    success('Action confirmée')
    pendingAction.value = null
    cancelReason.value = ''
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

async function markPaid() {
  try {
    await api.post('/cash/payments', {
      parcelId: props.id,
      amountUsd: Number(parcel.value.priceUsd),
      mode: 'cash',
    })
    success('Paiement enregistré')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="text-center text-slate-400 py-12">Chargement...</div>

  <div v-else-if="parcel" class="space-y-6">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-slate-400">Numéro de suivi</p>
        <h1 class="text-2xl font-mono font-bold text-slate-900">{{ parcel.trackingNumber }}</h1>
      </div>
      <div class="flex gap-2">
        <StateBadge :state="parcel.currentState" />
        <StateBadge :state="parcel.paymentState" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="label">Expéditeur</p>
            <p class="text-slate-800 font-medium">{{ parcel.sender.fullName }}</p>
            <p class="text-slate-500">{{ parcel.sender.phone }}</p>
          </div>
          <div>
            <p class="label">Destinataire</p>
            <p class="text-slate-800 font-medium">{{ parcel.recipient.fullName }}</p>
            <p class="text-slate-500">{{ parcel.recipient.phone }}</p>
          </div>
          <div>
            <p class="label">Trajet</p>
            <p class="text-slate-800">{{ parcel.originCountry }} → {{ parcel.destCountry }}</p>
          </div>
          <div>
            <p class="label">Poids / Catégorie</p>
            <p class="text-slate-800">{{ parcel.weightKg }} kg · {{ parcel.category }}</p>
          </div>
          <div>
            <p class="label">Montant</p>
            <p class="text-slate-800">{{ formatMoney(parcel.priceUsd, 'USD') }} ({{ formatMoney(parcel.priceXof, 'XOF') }})</p>
          </div>
          <div>
            <p class="label">Livraison estimée</p>
            <p class="text-slate-800">{{ formatDate(parcel.estimatedDelivery) }}</p>
          </div>
          <div v-if="parcel.box" class="col-span-2">
            <p class="label">BOX</p>
            <p class="text-slate-800">{{ parcel.box.reference }}</p>
          </div>
        </div>

        <div class="card p-5">
          <h2 class="font-medium text-slate-700 mb-4">Historique</h2>
          <ParcelTimeline :events="events" />
        </div>
      </div>

      <!-- Right: actions -->
      <div class="space-y-4">
        <div class="card p-5 space-y-3">
          <h2 class="font-medium text-slate-700">Actions</h2>
          <button
            v-for="action in allowedActions"
            :key="action"
            class="btn-secondary w-full justify-start"
            :class="action === 'cancel' && '!bg-red-50 !text-red-600 hover:!bg-red-100'"
            @click="pendingAction = action"
          >
            {{ ACTION_LABELS[action]?.icon }} {{ ACTION_LABELS[action]?.label ?? action }}
          </button>
          <p v-if="allowedActions.length === 0" class="text-sm text-slate-400 text-center py-2">
            Aucune action disponible
          </p>

          <button
            v-if="parcel.paymentState === 'pending'"
            class="btn-primary w-full"
            @click="markPaid"
          >
            💳 Marquer payé
          </button>
        </div>

        <div class="card p-5 space-y-3">
          <h2 class="font-medium text-slate-700">Notifier</h2>
          <NotifyCustomerButtons :parcel-id="parcel.id" />
        </div>
      </div>
    </div>

    <!-- Confirm modal -->
    <Modal v-if="pendingAction" title="Confirmation" @close="pendingAction = null">
      <p class="text-slate-600 mb-4">{{ ACTION_LABELS[pendingAction]?.confirm ?? 'Confirmer cette action ?' }}</p>
      <div v-if="pendingAction === 'cancel'" class="mb-4">
        <label class="label">Raison de l'annulation</label>
        <input v-model="cancelReason" class="input" placeholder="Ex: demande du client" />
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary flex-1" @click="pendingAction = null">Annuler</button>
        <button class="btn-primary flex-1" @click="confirmAction">Confirmer</button>
      </div>
    </Modal>
  </div>
</template>
