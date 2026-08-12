<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScanStore } from '../stores/scan.js'
import StateBadge from '../components/StateBadge.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ProofCaptureModal from '../components/ProofCaptureModal.vue'
import NotifyCustomerButtons from '../components/NotifyCustomerButtons.vue'
import { ACTION_LABELS } from '../lib/action-labels.js'
import { getAdminSocket } from '../lib/socket.js'

const router = useRouter()
const scanStore = useScanStore()

const pendingAction = ref<string | null>(null)
const showProofCapture = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const cancelReason = ref('')

// Live-sync: if another agent transitions this same parcel while it's open
// here, reflect it immediately instead of letting this screen go stale.
const socket = getAdminSocket()
function onParcelUpdated(payload: { trackingNumber: string; toState: string }) {
  if (scanStore.parcel && payload.trackingNumber === scanStore.parcel.trackingNumber) {
    scanStore.parcel = { ...scanStore.parcel, currentState: payload.toState }
  }
}

onMounted(() => {
  if (scanStore.parcel) socket.emit('parcel:watch', { trackingNumber: scanStore.parcel.trackingNumber })
  socket.on('parcel:updated', onParcelUpdated)
})
onBeforeUnmount(() => {
  if (scanStore.parcel) socket.emit('parcel:unwatch', { trackingNumber: scanStore.parcel.trackingNumber })
  socket.off('parcel:updated', onParcelUpdated)
})

function requestAction(action: string) {
  if (action === 'deliver') {
    showProofCapture.value = true
    return
  }
  pendingAction.value = action
}

async function confirmSimpleAction() {
  if (!pendingAction.value) return
  if (pendingAction.value === 'cancel' && cancelReason.value.trim().length < 3) return
  const action = pendingAction.value
  const metadata = action === 'cancel' ? { reason: cancelReason.value.trim() } : {}
  pendingAction.value = null
  cancelReason.value = ''
  await runTransition(action, metadata)
}

async function confirmDelivery(photoDataUrl: string) {
  showProofCapture.value = false
  await runTransition('deliver', {
    photo: photoDataUrl,
    recipientSignature: 'captured-on-device', // MVP: photo doubles as proof; e-signature pad is a future upgrade
  })
}

async function runTransition(action: string, metadata: Record<string, unknown> = {}) {
  const result = await scanStore.transition(action, metadata)
  if (result.success) {
    toast.value = { type: 'success', message: 'Action confirmée ✅' }
    setTimeout(() => (toast.value = null), 2500)
  } else {
    toast.value = { type: 'error', message: result.message ?? 'Erreur' }
    setTimeout(() => (toast.value = null), 3500)
  }
}

function backToScan() {
  scanStore.reset()
  router.push({ name: 'scan' })
}
</script>

<template>
  <div class="min-h-screen p-5 space-y-5">
    <button class="text-slate-400 text-sm" @click="backToScan">← Scanner un autre colis</button>

    <div v-if="scanStore.parcel" class="space-y-5">
      <div class="card space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-slate-500">Numéro de suivi</p>
            <p class="text-lg font-mono font-semibold text-white">
              {{ scanStore.parcel.trackingNumber }}
            </p>
          </div>
          <StateBadge :state="scanStore.parcel.currentState" />
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-slate-800">
          <div>
            <p class="text-slate-500">Expéditeur</p>
            <p class="text-slate-200">{{ scanStore.parcel.sender.fullName }}</p>
          </div>
          <div>
            <p class="text-slate-500">Destinataire</p>
            <p class="text-slate-200">{{ scanStore.parcel.recipient.fullName }}</p>
          </div>
          <div>
            <p class="text-slate-500">Trajet</p>
            <p class="text-slate-200">{{ scanStore.parcel.originCountry }} → {{ scanStore.parcel.destCountry }}</p>
          </div>
          <div>
            <p class="text-slate-500">Poids</p>
            <p class="text-slate-200">{{ scanStore.parcel.weightKg }} kg</p>
          </div>
          <div v-if="scanStore.parcel.box">
            <p class="text-slate-500">BOX</p>
            <p class="text-slate-200">{{ scanStore.parcel.box.reference }}</p>
          </div>
        </div>
      </div>

      <NotifyCustomerButtons :parcel-id="scanStore.parcel.id" />

      <div v-if="scanStore.allowedActions.length" class="space-y-3">
        <p class="text-sm text-slate-400 px-1">Actions disponibles</p>
        <button
          v-for="action in scanStore.allowedActions"
          :key="action"
          class="btn-primary"
          :class="action === 'cancel' && '!bg-red-600 active:!bg-red-700'"
          @click="requestAction(action)"
        >
          <span>{{ ACTION_LABELS[action]?.icon ?? '•' }}</span>
          <span>{{ ACTION_LABELS[action]?.label ?? action }}</span>
        </button>
      </div>
      <p v-else class="text-center text-slate-500 text-sm py-6">
        Aucune action disponible pour votre rôle sur ce colis
      </p>
    </div>

    <!-- Simple confirm modal -->
    <ConfirmModal
      v-if="pendingAction"
      :icon="ACTION_LABELS[pendingAction]?.icon ?? '⚠️'"
      :message="ACTION_LABELS[pendingAction]?.confirm ?? 'Confirmer cette action ?'"
      @confirm="confirmSimpleAction"
      @cancel="pendingAction = null; cancelReason = ''"
    >
      <div v-if="pendingAction === 'cancel'">
        <input
          v-model="cancelReason"
          class="w-full h-11 rounded-xl bg-slate-800 border border-slate-700 px-3 text-sm text-white
                 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Raison de l'annulation (ex: demande du client)"
        />
      </div>
    </ConfirmModal>

    <!-- Photo + signature capture for delivery -->
    <ProofCaptureModal
      v-if="showProofCapture"
      @confirm="confirmDelivery"
      @cancel="showProofCapture = false"
    />

    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed bottom-6 inset-x-6 rounded-2xl px-5 py-4 text-center font-medium z-[60]"
      :class="toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'"
    >
      {{ toast.message }}
    </div>
  </div>
</template>
