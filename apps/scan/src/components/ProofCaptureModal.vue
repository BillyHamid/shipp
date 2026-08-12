<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const emit = defineEmits<{ confirm: [photoDataUrl: string]; cancel: [] }>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const photo = ref<string | null>(null)
let stream: MediaStream | null = null

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  if (videoRef.value) {
    videoRef.value.srcObject = stream
    await videoRef.value.play()
  }
}

function takePhoto() {
  const video = videoRef.value!
  const canvas = canvasRef.value!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg', 0.85)
  stopCamera()
}

function retake() {
  photo.value = null
  startCamera()
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
}

function confirm() {
  if (photo.value) emit('confirm', photo.value)
}

startCamera()
onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col">
    <div class="flex-1 relative">
      <video v-if="!photo" ref="videoRef" class="w-full h-full object-cover" autoplay playsinline muted />
      <img v-else :src="photo" class="w-full h-full object-cover" alt="Photo preuve" />
      <canvas ref="canvasRef" class="hidden" />
    </div>

    <div class="p-6 space-y-3 bg-slate-950">
      <p class="text-center text-sm text-slate-400">
        {{ photo ? 'Photo capturée — confirmer la livraison ?' : 'Photographiez le destinataire recevant son colis' }}
      </p>

      <button v-if="!photo" class="btn-primary" @click="takePhoto">📸 Prendre la photo</button>
      <template v-else>
        <button class="btn-primary" @click="confirm">✅ Confirmer la livraison</button>
        <button class="btn-secondary" @click="retake">🔄 Reprendre</button>
      </template>
      <button class="text-slate-500 text-sm w-full py-2" @click="emit('cancel')">Annuler</button>
    </div>
  </div>
</template>
