<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { useAuthStore } from '../stores/auth.js'
import { useScanStore } from '../stores/scan.js'

const router = useRouter()
const auth = useAuthStore()
const scanStore = useScanStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const status = ref<'idle' | 'starting' | 'scanning' | 'processing' | 'error'>('idle')
const errorMessage = ref('')

let controls: IScannerControls | null = null
const reader = new BrowserQRCodeReader()
let disposed = false
let recognized = false

async function startScanning() {
  if (['starting', 'scanning', 'processing'].includes(status.value)) return
  controls?.stop()
  recognized = false
  status.value = 'starting'
  errorMessage.value = ''
  try {
    controls = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      videoRef.value!,
      async (result, err) => {
        if (result && !recognized && !disposed) {
          recognized = true
          status.value = 'processing'
          controls?.stop()
          const qrUrl = result.getText()
          await scanStore.lookupByQrUrl(qrUrl)
          if (disposed) return
          if (scanStore.parcel) {
            router.push({ name: 'parcel-action', params: { trackingNumber: scanStore.parcel.trackingNumber } })
          } else {
            status.value = 'error'
            errorMessage.value = scanStore.error ?? 'QR code non reconnu'
          }
        }
        // NotFoundException from zxing fires continuously while no code is
        // in frame — that's expected, not a real error, so we ignore it.
        void err
      },
    )
    if (disposed || recognized) controls.stop()
    else status.value = 'scanning'
  } catch {
    status.value = 'error'
    errorMessage.value = "Impossible d'accéder à la caméra. Vérifiez les permissions."
  }
}

function retry() {
  scanStore.reset()
  startScanning()
}

onBeforeUnmount(() => { disposed = true; controls?.stop() })
</script>

<template>
  <div class="scan-page scan-workspace flex flex-col gap-6">
    <header class="scan-header flex items-center justify-between"><div class="flex items-center gap-3"><div class="brand-mark size-10 font-extrabold text-sm flex items-center justify-center">GSG</div><div><p class="font-semibold text-sm">GSG Scan</p><p class="text-[11px] text-[#a7bfc7] mt-0.5">{{ auth.user?.fullName }}</p></div></div><button aria-label="Se déconnecter" title="Se déconnecter" class="logout-button size-11 flex items-center justify-center" @click="auth.logout().then(() => router.push('/login'))"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 4H4v16h6m4-12 4 4-4 4m-6-4h12" /></svg></button></header>
    <div class="pt-3"><p class="eyebrow mb-3">Identifier · Vérifier · Confirmer</p><h1 class="scan-heading">Scanner un colis</h1><p class="text-sm text-[#a7bfc7] mt-3 leading-relaxed">Placez le QR code de l’étiquette dans le cadre.</p></div>
    <div class="scanner-window scanner-grid"><video ref="videoRef" class="absolute inset-0 w-full h-full object-cover" autoplay playsinline muted /><div class="scan-frame"></div><div v-if="status === 'scanning'" class="scan-beam"></div><div v-if="status !== 'scanning'" class="absolute inset-0 flex items-center justify-center"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h3v3h-3zm6 0v6h-6m3-3h3" /></svg></div><div class="absolute bottom-5 inset-x-0 text-center"><span class="scan-status">{{ status === 'scanning' ? 'Caméra active · Lecture automatique' : status === 'processing' ? 'Recherche du colis…' : 'Lecture QR sécurisée' }}</span></div></div>
    <div class="space-y-3" aria-live="polite"><div v-if="status === 'error'" role="alert" class="rounded-xl p-4 bg-red-950/30 border border-red-400/20 text-sm text-red-200">{{ errorMessage }}</div><button v-if="status === 'idle' || status === 'error'" class="btn-primary" @click="retry">{{ status === 'error' ? 'Réessayer la caméra' : 'Activer la caméra' }} <span aria-hidden="true">→</span></button><p v-else class="text-center text-sm text-[#a7bfc7] py-2">{{ status === 'starting' ? 'Autorisez l’accès à la caméra pour continuer.' : status === 'processing' ? 'Vérification des informations du colis…' : 'Maintenez le téléphone stable quelques instants.' }}</p></div>
    <div class="card !p-4 flex gap-3"><span class="text-[#70d3c2] text-lg" aria-hidden="true">↗</span><div><p class="text-xs font-semibold text-[#d7e8eb]">Une étiquette bien visible</p><p class="text-xs text-[#92b1ba] leading-relaxed mt-1">Évitez les reflets et gardez le QR code entier dans le cadre. La fiche du colis s’ouvrira automatiquement.</p></div></div>
    <footer class="mt-auto pt-2 flex justify-between text-[10px] text-[#92b1ba]"><span>GSG Logistique</span><span>USA ↔ Burkina Faso</span></footer>
  </div>
</template>
