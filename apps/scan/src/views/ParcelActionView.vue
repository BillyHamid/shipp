<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScanStore } from '../stores/scan.js'
import { api } from '../lib/api.js'
import StateBadge from '../components/StateBadge.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ProofCaptureModal from '../components/ProofCaptureModal.vue'
import ConditionCaptureModal from '../components/ConditionCaptureModal.vue'
import NotifyCustomerButtons from '../components/NotifyCustomerButtons.vue'
import { ACTION_LABELS } from '../lib/action-labels.js'
import { getAdminSocket } from '../lib/socket.js'

const router = useRouter()
const scanStore = useScanStore()

const pendingAction = ref<string | null>(null)
const showProofCapture = ref(false)
const showConditionCapture = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const cancelReason = ref('')
const openBoxes = ref<any[]>([])
const selectedBoxId = ref('')

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

async function requestAction(action: string) {
  if (action === 'deliver') {
    showProofCapture.value = true
    return
  }
  pendingAction.value = action
  if (action === 'assign_to_box' && scanStore.parcel) {
    selectedBoxId.value = ''
    const res = await api.get('/boxes', { params: { status: 'open', pageSize: 100 } })
    openBoxes.value = res.data.items.filter(
      (b: any) =>
        b.originCountry === scanStore.parcel!.originCountry && b.destCountry === scanStore.parcel!.destCountry,
    )
  }
}

async function confirmSimpleAction() {
  if (!pendingAction.value) return
  if (pendingAction.value === 'cancel' && cancelReason.value.trim().length < 3) return
  if (pendingAction.value === 'assign_to_box' && !selectedBoxId.value) return
  const action = pendingAction.value
  const metadata =
    action === 'cancel'
      ? { reason: cancelReason.value.trim() }
      : action === 'assign_to_box'
        ? { boxId: selectedBoxId.value }
        : {}
  pendingAction.value = null
  cancelReason.value = ''
  selectedBoxId.value = ''
  await runTransition(action, metadata)
}

async function confirmDelivery(photoDataUrl: string) {
  showProofCapture.value = false
  await runTransition('deliver', {
    photo: photoDataUrl,
    recipientSignature: 'captured-on-device', // MVP: photo doubles as proof; e-signature pad is a future upgrade
  })
}

async function saveCondition(payload: { condition: string; note?: string; photo?: string }) {
  const result = await scanStore.recordCondition(payload)
  if (result.success) {
    showConditionCapture.value = false
    toast.value = { type: 'success', message: 'Contrôle d’état enregistré' }
  } else {
    toast.value = { type: 'error', message: result.message ?? 'Erreur lors de l’enregistrement' }
  }
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
  <div class="scan-page parcel-action space-y-6">
    <button class="back-to-scan min-h-11 text-sm" @click="backToScan">← Scanner un autre colis</button>

    <div v-if="scanStore.parcel" class="space-y-5"><div><p class="eyebrow mb-2">Colis identifié</p><h1 class="scan-heading">Vérifier et agir</h1><p class="text-sm text-[#a7bfc7] mt-2">Confirmez les informations avant de continuer.</p></div>
      <div class="card space-y-3">
        <div class="flex flex-wrap gap-3 items-start justify-between">
          <div>
            <p class="text-xs text-slate-400">Numéro de suivi</p>
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

      <button class="btn-secondary" @click="showConditionCapture = true">◈ Contrôler l’état du colis</button>

      <div v-if="scanStore.allowedActions.length" class="space-y-3">
        <p class="actions-label text-sm px-1">Actions disponibles</p>
        <button
          v-for="action in scanStore.allowedActions"
          :key="action"
          class="btn-primary"
          :class="action === 'cancel' && '!bg-red-950/40 !text-red-200 border border-red-400/30 active:!bg-red-900'"
          @click="requestAction(action)"
        >
          <span>{{ ACTION_LABELS[action]?.icon ?? '•' }}</span>
          <span>{{ ACTION_LABELS[action]?.label ?? action }}</span>
        </button>
      </div>
      <p v-else class="empty-actions text-center text-sm py-6">
        Aucune action disponible pour votre rôle sur ce colis
      </p>
    </div>

    <div v-if="!scanStore.parcel" class="card text-center space-y-4"><h1 class="text-xl font-semibold">Scannez un colis pour commencer</h1><p class="text-sm text-slate-400">La fiche sera disponible après lecture de son QR code.</p><button class="btn-primary" @click="backToScan">Ouvrir le scanner</button></div>

    <!-- Simple confirm modal -->
    <ConfirmModal
      v-if="pendingAction"
      :icon="ACTION_LABELS[pendingAction]?.icon ?? '⚠️'"
      :message="ACTION_LABELS[pendingAction]?.confirm ?? 'Confirmer cette action ?'"
      @confirm="confirmSimpleAction"
      @cancel="pendingAction = null; cancelReason = ''; selectedBoxId = ''"
    >
      <div v-if="pendingAction === 'cancel'">
        <input
          v-model="cancelReason"
          class="w-full h-11 rounded-xl bg-slate-800 border border-slate-700 px-3 text-sm text-white
                 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Raison de l'annulation (ex: demande du client)"
        />
      </div>
      <div v-if="pendingAction === 'assign_to_box'">
        <select
          v-model="selectedBoxId"
          class="w-full h-11 rounded-xl bg-slate-800 border border-slate-700 px-3 text-sm text-white
                 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="" disabled>Sélectionner une BOX ouverte...</option>
          <option v-for="b in openBoxes" :key="b.id" :value="b.id">
            {{ b.reference }} ({{ b._count.parcels }} colis)
          </option>
        </select>
        <p v-if="!openBoxes.length" class="text-xs text-amber-400 mt-2">
          Aucune BOX ouverte sur ce trajet. Créez-en une dans l'Admin d'abord.
        </p>
      </div>
    </ConfirmModal>

    <!-- Photo + signature capture for delivery -->
    <ProofCaptureModal
      v-if="showProofCapture"
      @confirm="confirmDelivery"
      @cancel="showProofCapture = false"
    />

    <ConditionCaptureModal v-if="showConditionCapture" @confirm="saveCondition" @cancel="showConditionCapture = false" />

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
