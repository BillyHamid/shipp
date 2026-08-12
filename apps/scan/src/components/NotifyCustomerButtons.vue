<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../lib/api.js'

const props = defineProps<{ parcelId: string }>()

interface NotifyLinks {
  whatsappUrl: string
}

const loading = ref<'whatsapp' | 'sms' | null>(null)
const error = ref<string | null>(null)
const smsSuccess = ref<string | null>(null)

async function sendWhatsapp() {
  loading.value = 'whatsapp'
  error.value = null
  try {
    const res = await api.get<NotifyLinks>(`/parcels/${props.parcelId}/notify-links`)
    window.open(res.data.whatsappUrl, '_blank')
    // Best-effort audit log — fire and forget, doesn't block the UX. We can't
    // confirm the agent actually pressed send in the external app.
    api.post(`/parcels/${props.parcelId}/notify-log`, { channel: 'whatsapp' }).catch(() => {})
  } catch {
    error.value = "Impossible de générer le message"
  } finally {
    loading.value = null
  }
}

async function sendSms() {
  loading.value = 'sms'
  error.value = null
  smsSuccess.value = null
  try {
    // Real send via the Aqilas gateway — not just opening the phone's SMS app.
    const res = await api.post(`/parcels/${props.parcelId}/notify-sms`)
    smsSuccess.value = `SMS envoyé (${res.data.cost} ${res.data.currency})`
    setTimeout(() => (smsSuccess.value = null), 4000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? "Échec de l'envoi du SMS"
  } finally {
    loading.value = null
  }
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm text-slate-400 px-1">Notifier le destinataire</p>
    <div class="grid grid-cols-2 gap-3">
      <button
        class="btn-primary !bg-emerald-600 active:!bg-emerald-700"
        :disabled="loading !== null"
        @click="sendWhatsapp"
      >
        <span>💬</span>
        <span>{{ loading === 'whatsapp' ? '...' : 'WhatsApp' }}</span>
      </button>
      <button class="btn-secondary" :disabled="loading !== null" @click="sendSms">
        <span>✉️</span>
        <span>{{ loading === 'sms' ? 'Envoi...' : 'SMS' }}</span>
      </button>
    </div>
    <p v-if="smsSuccess" class="text-sm text-emerald-400 px-1">{{ smsSuccess }}</p>
    <p v-if="error" class="text-sm text-red-400 px-1">{{ error }}</p>
  </div>
</template>
