<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatDate, formatDateTime, formatMoney } from '../../lib/format.js'
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
const openBoxes = ref<any[]>([])
const selectedBoxId = ref('')
const qrObjectUrl = ref<string | null>(null)
const showQrModal = ref(false)
const showPaidModal = ref(false)
const cashAccounts = ref<any[]>([])
const selectedCashAccountId = ref('')
const payments = ref<any[]>([])
const paymentAmount = ref(0)

const totalPaidUsd = computed(() =>
  payments.value.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amountUsd), 0),
)
const remainingUsd = computed(() => Math.max(0, Number(parcel.value?.priceUsd ?? 0) - totalPaidUsd.value))

async function load() {
  loading.value = true
  const [pRes, eRes, aRes, payRes] = await Promise.all([
    api.get(`/parcels/${props.id}`),
    api.get(`/parcels/${props.id}/events`),
    api.get(`/parcels/${props.id}/allowed-actions`),
    api.get('/cash/payments', { params: { parcelId: props.id } }),
  ])
  parcel.value = pRes.data
  events.value = eRes.data
  allowedActions.value = aRes.data.actions
  payments.value = payRes.data
  loading.value = false
}

async function refundPayment(paymentId: string) {
  try {
    await api.post(`/cash/payments/${paymentId}/refund`)
    success('Paiement remboursé')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

async function openActionModal(action: string) {
  pendingAction.value = action
  if (action === 'assign_to_box') {
    selectedBoxId.value = ''
    const res = await api.get('/boxes', { params: { status: 'open', pageSize: 100 } })
    openBoxes.value = res.data.items.filter(
      (b: any) => b.originCountry === parcel.value.originCountry && b.destCountry === parcel.value.destCountry,
    )
  }
}

async function confirmAction() {
  if (!pendingAction.value) return
  const action = pendingAction.value
  if (action === 'assign_to_box' && !selectedBoxId.value) {
    toastError('Choisissez une BOX')
    return
  }
  try {
    const metadata: Record<string, unknown> = {}
    if (action === 'cancel') metadata.reason = cancelReason.value
    if (action === 'assign_to_box') metadata.boxId = selectedBoxId.value
    await api.post(`/parcels/${props.id}/transitions`, { action, metadata })
    success('Action confirmée')
    pendingAction.value = null
    cancelReason.value = ''
    selectedBoxId.value = ''
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

async function viewQr() {
  try {
    const res = await api.get(`/parcels/${props.id}/qr`, { responseType: 'blob' })
    qrObjectUrl.value = URL.createObjectURL(res.data)
    showQrModal.value = true
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

function closeQrModal() {
  showQrModal.value = false
  if (qrObjectUrl.value) URL.revokeObjectURL(qrObjectUrl.value)
  qrObjectUrl.value = null
}

function printQr() {
  if (!qrObjectUrl.value || !parcel.value) return
  const win = window.open('', '_blank', 'width=420,height=560')
  if (!win) return
  win.document.write(`
    <html>
      <head>
        <title>${parcel.value.trackingNumber}</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 24px; }
          img { width: 260px; height: 260px; }
          h1 { font-size: 16px; font-family: monospace; margin: 12px 0 4px; }
          p { font-size: 12px; color: #555; margin: 0; }
        </style>
      </head>
      <body>
        <img src="${qrObjectUrl.value}" alt="QR" />
        <h1>${parcel.value.trackingNumber}</h1>
        <p>${parcel.value.originCountry} → ${parcel.value.destCountry}</p>
      </body>
    </html>
  `)
  win.document.close()
  win.onload = () => win.print()
}

function receiptText(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char] ?? char))
}

async function printReceipt() {
  if (!parcel.value) return
  let receiptQrUrl = qrObjectUrl.value
  let revokeAfterPrint = false

  try {
    if (!receiptQrUrl) {
      const res = await api.get(`/parcels/${props.id}/qr`, { responseType: 'blob' })
      receiptQrUrl = URL.createObjectURL(res.data)
      revokeAfterPrint = true
    }

    const win = window.open('', '_blank', 'width=760,height=900')
    if (!win) {
      if (revokeAfterPrint && receiptQrUrl) URL.revokeObjectURL(receiptQrUrl)
      toastError('Autorisez les fenêtres surgissantes pour imprimer le reçu')
      return
    }

    const p = parcel.value
    const paymentTiming = p.paymentTiming === 'at_arrival' ? "À l'arrivée" : "À l'envoi"
    win.document.write(`<!doctype html><html lang="fr"><head><title>Reçu ${receiptText(p.trackingNumber)}</title><style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; } body { margin: 0; color: #302426; font-family: Arial, sans-serif; font-size: 12px; }
      .receipt { max-width: 680px; margin: auto; border: 1px solid #eadfe0; border-radius: 18px; overflow: hidden; }
      header { background: #3e151b; color: white; padding: 26px 30px; display: flex; justify-content: space-between; gap: 24px; }
      .brand { font-weight: 800; letter-spacing: .08em; font-size: 18px; } .brand small { display: block; margin-top: 5px; color: #f9b8c0; font-size: 8px; letter-spacing: .18em; }
      .receipt-label { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #f9b8c0; text-align: right; } .number { font-family: monospace; font-size: 15px; font-weight: bold; margin-top: 6px; }
      main { padding: 28px 30px; } h1 { font-size: 20px; margin: 0 0 5px; } .sub { color: #806e71; margin: 0 0 23px; }
      .route { display: flex; align-items: center; justify-content: space-between; padding: 17px; border-radius: 12px; background: #fff2f3; color: #6e1722; font-weight: bold; font-size: 15px; } .route span { font-size: 11px; color: #a56970; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 23px 0; border-bottom: 1px solid #eadfe0; } .label { color: #947d80; font-size: 9px; font-weight: bold; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 5px; } .value { font-size: 13px; font-weight: 600; line-height: 1.45; }
      .summary { display: grid; grid-template-columns: 1fr 150px; gap: 22px; padding-top: 24px; align-items: center; } .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } .qr { text-align: center; } .qr img { width: 130px; height: 130px; display: block; margin: auto; } .qr p { margin: 7px 0 0; color: #806e71; font-size: 10px; }
      footer { padding: 16px 30px; color: #806e71; border-top: 1px solid #eadfe0; font-size: 10px; line-height: 1.5; } @media print { .receipt { border: 0; } }
    </style></head><body><article class="receipt"><header><div class="brand">GSG<span style="color:#fb7185">.</span><small>GLOBAL SHIPPING GROUP</small></div><div><div class="receipt-label">Reçu d'expédition</div><div class="number">${receiptText(p.trackingNumber)}</div></div></header><main>
      <h1>Votre colis est enregistré</h1><p class="sub">Conservez ce reçu et présentez le QR code lors de toute vérification.</p>
      <div class="route"><div><span>ORIGINE</span><br>${receiptText(p.originCountry)}</div><div>→</div><div style="text-align:right"><span>DESTINATION</span><br>${receiptText(p.destCountry)}</div></div>
      <section class="grid"><div><div class="label">Expéditeur</div><div class="value">${receiptText(p.sender.fullName)}<br><span style="font-weight:normal;color:#806e71">${receiptText(p.sender.phone)}</span></div></div><div><div class="label">Destinataire</div><div class="value">${receiptText(p.recipient.fullName)}<br><span style="font-weight:normal;color:#806e71">${receiptText(p.recipient.phone)}</span></div></div></section>
      <section class="summary"><div class="meta"><div><div class="label">Contenu</div><div class="value">${receiptText(p.category)}${p.description ? `<br><span style="font-weight:normal;color:#806e71">${receiptText(p.description)}</span>` : ''}</div></div><div><div class="label">Poids</div><div class="value">${receiptText(p.weightKg)} kg</div></div><div><div class="label">Montant</div><div class="value">${receiptText(formatMoney(p.priceUsd, 'USD'))}<br><span style="font-weight:normal;color:#806e71">${receiptText(formatMoney(p.priceXof, 'XOF'))}</span></div></div><div><div class="label">Paiement</div><div class="value">${receiptText(paymentTiming)}<br><span style="font-weight:normal;color:#806e71">${receiptText(p.paymentState === 'paid' ? 'Payé' : 'En attente')}</span></div></div></div>
        <div class="qr"><img src="${receiptQrUrl}" alt="QR code du colis" /><p>Scannez pour consulter le suivi</p></div></section>
    </main><footer>GSG Logistique · USA ↔ Afrique de l’Ouest<br>Émis le ${receiptText(formatDateTime(new Date().toISOString()))}</footer></article></body></html>`)
    win.document.close()
    win.onload = () => {
      win.print()
      if (revokeAfterPrint && receiptQrUrl) window.setTimeout(() => URL.revokeObjectURL(receiptQrUrl!), 1000)
    }
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Impossible de générer le reçu')
  }
}

async function openPaidModal() {
  selectedCashAccountId.value = ''
  paymentAmount.value = remainingUsd.value
  const res = await api.get('/cash/accounts')
  cashAccounts.value = res.data.filter((a: any) => a.active)
  showPaidModal.value = true
}

async function confirmMarkPaid() {
  if (!selectedCashAccountId.value) {
    toastError('Choisissez la caisse qui reçoit ce paiement')
    return
  }
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    toastError('Montant invalide')
    return
  }
  try {
    await api.post('/cash/payments', {
      parcelId: props.id,
      amountUsd: paymentAmount.value,
      mode: 'cash',
      cashAccountId: selectedCashAccountId.value,
    })
    success('Paiement enregistré')
    showPaidModal.value = false
    selectedCashAccountId.value = ''
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16">
    <Icon icon="ph:spinner-gap-bold" class="size-6 animate-spin text-ink-300" />
  </div>

  <div v-else-if="parcel" class="space-y-6">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs font-semibold text-ink-500 uppercase tracking-wide">Numéro de suivi</p>
        <h1 class="text-2xl font-mono font-bold text-ink-900 mt-0.5">{{ parcel.trackingNumber }}</h1>
      </div>
      <div class="flex gap-2 items-center">
        <StateBadge :state="parcel.currentState" />
        <StateBadge :state="parcel.paymentState" />
        <button class="btn-secondary" @click="viewQr">
          <Icon icon="ph:qr-code-bold" class="size-4" />
          Voir le QR
        </button>
        <button class="btn-primary" @click="printReceipt">
          <Icon icon="ph:printer-bold" class="size-4" />
          Imprimer le reçu
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-5 grid grid-cols-2 gap-5 text-sm">
          <div>
            <p class="label">Expéditeur</p>
            <p class="text-ink-800 font-medium">{{ parcel.sender.fullName }}</p>
            <p class="text-ink-500">{{ parcel.sender.phone }}</p>
          </div>
          <div>
            <p class="label">Destinataire</p>
            <p class="text-ink-800 font-medium">{{ parcel.recipient.fullName }}</p>
            <p class="text-ink-500">{{ parcel.recipient.phone }}</p>
          </div>
          <div>
            <p class="label">Trajet</p>
            <p class="text-ink-800">{{ parcel.originCountry }} → {{ parcel.destCountry }}</p>
          </div>
          <div>
            <p class="label">Poids / Catégorie</p>
            <p class="text-ink-800">{{ parcel.weightKg }} kg · {{ parcel.category }}</p>
          </div>
          <div>
            <p class="label">Montant</p>
            <p class="text-ink-800">{{ formatMoney(parcel.priceUsd, 'USD') }} ({{ formatMoney(parcel.priceXof, 'XOF') }})</p>
          </div>
          <div>
            <p class="label">Type de paiement</p>
            <p class="text-ink-800 flex items-center gap-1.5">
              <Icon :icon="parcel.paymentTiming === 'at_arrival' ? 'ph:hand-coins-bold' : 'ph:package-bold'" class="size-4 text-ink-400" />
              {{ parcel.paymentTiming === 'at_arrival' ? "À l'arrivée" : "À l'envoi" }}
            </p>
          </div>
          <div>
            <p class="label">Livraison estimée</p>
            <p class="text-ink-800">{{ formatDate(parcel.estimatedDelivery) }}</p>
          </div>
          <div v-if="parcel.box" class="col-span-2">
            <p class="label">BOX</p>
            <p class="text-ink-800">{{ parcel.box.reference }}</p>
          </div>
        </div>

        <div class="card p-5">
          <h2 class="font-display font-bold text-ink-900 mb-4">Historique</h2>
          <ParcelTimeline :events="events" />
        </div>
      </div>

      <!-- Right: actions -->
      <div class="space-y-4">
        <div class="card p-5 space-y-2.5">
          <h2 class="font-display font-bold text-ink-900 mb-1">Actions</h2>
          <button
            v-for="action in allowedActions"
            :key="action"
            class="btn-secondary w-full justify-start"
            :class="action === 'cancel' && '!bg-red-50 !text-red-600 hover:!bg-red-100'"
            @click="openActionModal(action)"
          >
            <Icon :icon="ACTION_LABELS[action]?.icon ?? 'ph:circle-bold'" class="size-4" />
            {{ ACTION_LABELS[action]?.label ?? action }}
          </button>
          <p v-if="allowedActions.length === 0" class="text-sm text-ink-300 text-center py-2">
            Aucune action disponible
          </p>

          <button
            v-if="parcel.paymentState === 'pending' || parcel.paymentState === 'partial'"
            class="btn-primary w-full"
            @click="openPaidModal"
          >
            <Icon icon="ph:credit-card-bold" class="size-4" />
            {{ parcel.paymentState === 'partial' ? 'Encaisser le reste' : 'Marquer payé' }}
          </button>
        </div>

        <div v-if="payments.length" class="card p-5 space-y-3">
          <h2 class="font-display font-bold text-ink-900">Paiements</h2>
          <div v-for="p in payments" :key="p.id" class="flex items-start justify-between gap-2 text-sm border-b border-ink-50 last:border-0 pb-3 last:pb-0">
            <div>
              <p class="font-medium text-ink-800 tabular-nums">
                {{ formatMoney(p.amountUsd, 'USD') }}
                <span v-if="p.status === 'refunded'" class="text-red-500 text-xs font-normal">(remboursé)</span>
              </p>
              <p class="text-xs text-ink-400">{{ formatDateTime(p.createdAt) }} · {{ p.cashAccount?.code ?? '—' }}</p>
            </div>
            <button
              v-if="p.status === 'paid'"
              class="text-xs font-medium text-red-600 hover:underline shrink-0"
              @click="refundPayment(p.id)"
            >
              Rembourser
            </button>
          </div>
        </div>

        <div class="card p-5 space-y-3">
          <h2 class="font-display font-bold text-ink-900">Notifier</h2>
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
      <div v-if="pendingAction === 'assign_to_box'" class="mb-4">
        <label class="label">BOX cible</label>
        <select v-model="selectedBoxId" class="input">
          <option value="" disabled>Sélectionner une BOX ouverte...</option>
          <option v-for="b in openBoxes" :key="b.id" :value="b.id">
            {{ b.reference }} ({{ b._count.parcels }} colis, {{ b.capacityKg }} kg max)
          </option>
        </select>
        <p v-if="!openBoxes.length" class="text-xs text-amber-600 mt-1">
          Aucune BOX ouverte sur ce trajet ({{ parcel.originCountry }} → {{ parcel.destCountry }}). Créez-en une d'abord.
        </p>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary flex-1" @click="pendingAction = null">Annuler</button>
        <button class="btn-primary flex-1" @click="confirmAction">Confirmer</button>
      </div>
    </Modal>

    <!-- QR modal -->
    <Modal v-if="showQrModal" title="QR code du colis" @close="closeQrModal">
      <div class="flex flex-col items-center gap-3">
        <img :src="qrObjectUrl!" alt="QR code" class="size-56" />
        <p class="font-mono text-sm text-slate-700">{{ parcel.trackingNumber }}</p>
        <p class="text-xs text-slate-400">À coller sur le colis pour un scan ultérieur</p>
      </div>
      <div class="flex gap-3 mt-4">
        <button class="btn-secondary flex-1" @click="closeQrModal">Fermer</button>
        <button class="btn-primary flex-1" @click="printQr">
          <Icon icon="ph:printer-bold" class="size-4" />
          Imprimer
        </button>
      </div>
    </Modal>

    <!-- Mark paid modal -->
    <Modal v-if="showPaidModal" title="Encaisser un paiement" @close="showPaidModal = false">
      <p class="text-slate-600 mb-4">
        Reste à payer : <span class="font-display font-bold text-ink-900">{{ formatMoney(remainingUsd, 'USD') }}</span>
        sur {{ formatMoney(parcel.priceUsd, 'USD') }} ({{ formatMoney(parcel.priceXof, 'XOF') }}).
      </p>
      <div class="mb-4">
        <label class="label">Montant encaissé (USD)</label>
        <input v-model.number="paymentAmount" type="number" step="0.01" :max="remainingUsd" min="0.01" class="input" />
        <p class="text-xs text-ink-400 mt-1">Laissez le montant complet pour un paiement total, ou réduisez pour un acompte.</p>
      </div>
      <div class="mb-4">
        <label class="label">Caisse qui reçoit ce paiement</label>
        <select v-model="selectedCashAccountId" class="input">
          <option value="" disabled>Sélectionner une caisse...</option>
          <option v-for="a in cashAccounts" :key="a.id" :value="a.id">
            {{ a.label }} ({{ a.code }} · {{ a.currency }})
          </option>
        </select>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary flex-1" @click="showPaidModal = false">Annuler</button>
        <button class="btn-primary flex-1" @click="confirmMarkPaid">Confirmer</button>
      </div>
    </Modal>
  </div>
</template>
