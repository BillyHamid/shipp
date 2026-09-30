<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

type Condition = 'conforme' | 'emballage_endommage' | 'ouvert_incomplet' | 'humide_autre'
const emit = defineEmits<{ confirm: [payload: { condition: Condition; note?: string; photo?: string }]; cancel: [] }>()
const options: Array<{ value: Condition; label: string }> = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'emballage_endommage', label: 'Emballage endommagé' },
  { value: 'ouvert_incomplet', label: 'Ouvert ou incomplet' },
  { value: 'humide_autre', label: 'Humide ou autre anomalie' },
]
const condition = ref<Condition>('conforme')
const note = ref('')
const photo = ref<string | null>(null)
const cameraError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const stream = ref<MediaStream | null>(null)

async function startCamera() {
  cameraError.value = ''
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    await nextTick()
    if (videoRef.value) { videoRef.value.srcObject = stream.value; await videoRef.value.play() }
  } catch {
    cameraError.value = 'Caméra indisponible. Autorisez-la ou choisissez une photo.'
  }
}
function takePhoto() {
  const video = videoRef.value!; const canvas = canvasRef.value!
  canvas.width = video.videoWidth; canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  photo.value = canvas.toDataURL('image/jpeg', 0.82)
  stopCamera()
}
function stopCamera() { stream.value?.getTracks().forEach((track) => track.stop()); stream.value = null }
function choosePhoto() { fileInputRef.value?.click() }
function loadPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { cameraError.value = 'Choisissez une image valide.'; return }
  const reader = new FileReader()
  reader.onload = () => { photo.value = String(reader.result); stopCamera() }
  reader.readAsDataURL(file)
}
function save() { emit('confirm', { condition: condition.value, note: note.value.trim() || undefined, photo: photo.value || undefined }) }
onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-5">
    <div class="mx-auto max-w-md space-y-5 py-5">
      <div><p class="eyebrow mb-2">Contrôle d’état</p><h2 class="text-xl font-semibold text-white">Constat du colis</h2><p class="mt-1 text-sm text-slate-400">Conservez une preuve visuelle en cas d’anomalie.</p></div>
      <div class="grid gap-2"><button v-for="option in options" :key="option.value" class="rounded-xl border px-4 py-3 text-left text-sm transition" :class="condition === option.value ? 'border-brand-400 bg-brand-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'" @click="condition = option.value">{{ option.label }}</button></div>
      <textarea v-model="note" rows="3" maxlength="500" class="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder:text-slate-500" placeholder="Note facultative : emplacement, dommage constaté…" />
      <div class="overflow-hidden rounded-2xl border border-slate-800 bg-black"><video v-if="!photo && stream" ref="videoRef" class="aspect-video w-full object-cover" autoplay playsinline muted /><img v-else-if="photo" :src="photo" class="aspect-video w-full object-cover" alt="État du colis" /><div v-else class="aspect-video grid place-items-center text-sm text-slate-500">Photo facultative</div><canvas ref="canvasRef" class="hidden" /></div>
      <p v-if="cameraError" class="text-sm text-amber-300">{{ cameraError }}</p>
      <input ref="fileInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="loadPhoto" />
      <div v-if="!photo" class="grid grid-cols-2 gap-3"><button v-if="!stream" class="btn-secondary" @click="startCamera">📷 Appareil photo</button><button v-if="stream" class="btn-secondary col-span-2" @click="takePhoto">📸 Prendre la photo</button><button v-if="!stream" class="btn-secondary" @click="choosePhoto">🖼️ Galerie</button></div><button v-else class="btn-secondary" @click="photo = null">Retirer la photo</button>
      <button class="btn-primary" @click="save">Enregistrer le contrôle</button><button class="w-full py-2 text-sm text-slate-500" @click="emit('cancel')">Annuler</button>
    </div>
  </div>
</template>
