<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { useAuthStore } from '../stores/auth.js'
import { useScanStore } from '../stores/scan.js'

const router = useRouter()
const auth = useAuthStore()
const scanStore = useScanStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const status = ref<'idle' | 'scanning' | 'error'>('idle')
const errorMessage = ref('')

let controls: IScannerControls | null = null
const reader = new BrowserQRCodeReader()

async function startScanning() {
  status.value = 'scanning'
  errorMessage.value = ''
  try {
    controls = await reader.decodeFromVideoDevice(
      undefined, // let the browser pick — usually rear camera on mobile
      videoRef.value!,
      async (result, err) => {
        if (result) {
          controls?.stop()
          const qrUrl = result.getText()
          await scanStore.lookupByQrUrl(qrUrl)
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
  } catch {
    status.value = 'error'
    errorMessage.value = "Impossible d'accéder à la caméra. Vérifiez les permissions."
  }
}

function retry() {
  scanStore.reset()
  startScanning()
}

onMounted(startScanning)
onBeforeUnmount(() => controls?.stop())
</script>

<template>
  <div class="relative min-h-screen bg-black">
    <!-- Header -->
    <div class="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-5">
      <div>
        <p class="text-white font-semibold">{{ auth.user?.fullName }}</p>
        <p class="text-xs text-slate-400">{{ auth.user?.role }}</p>
      </div>
      <button
        class="size-10 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-300"
        @click="auth.logout().then(() => router.push('/login'))"
      >
        ⏻
      </button>
    </div>

    <!-- Camera feed -->
    <video ref="videoRef" class="w-full h-screen object-cover" autoplay playsinline muted />

    <!-- Viewfinder overlay -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="size-64 rounded-3xl border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
    </div>

    <!-- Bottom instructions / errors -->
    <div class="absolute bottom-0 inset-x-0 p-6 z-20 text-center">
      <p v-if="status === 'scanning'" class="text-white/90 text-sm">
        Placez le QR code du colis dans le cadre
      </p>
      <div v-else-if="status === 'error'" class="space-y-3">
        <p class="text-red-400 text-sm">{{ errorMessage }}</p>
        <button class="btn-primary" @click="retry">Réessayer</button>
      </div>
    </div>
  </div>
</template>
