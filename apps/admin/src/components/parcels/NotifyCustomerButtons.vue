<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps<{ parcelId: string }>()
const { success, error: toastError } = useToast()

interface NotifyLinks {
  whatsappUrl: string
}

const loading = ref<'whatsapp' | 'sms' | null>(null)

async function sendWhatsapp() {
  loading.value = 'whatsapp'
  try {
    const res = await api.get<NotifyLinks>(`/parcels/${props.parcelId}/notify-links`)
    window.open(res.data.whatsappUrl, '_blank')
    api.post(`/parcels/${props.parcelId}/notify-log`, { channel: 'whatsapp' }).catch(() => {})
    success('Message préparé — vérifiez la fenêtre ouverte')
  } catch {
    toastError('Impossible de générer le message')
  } finally {
    loading.value = null
  }
}

async function sendSms() {
  loading.value = 'sms'
  try {
    // Real send via the Aqilas gateway — not a mailto/sms: link this time.
    const res = await api.post(`/parcels/${props.parcelId}/notify-sms`)
    success(`SMS envoyé (${res.data.cost} ${res.data.currency})`)
  } catch (e: any) {
    toastError(e.response?.data?.message ?? "Échec de l'envoi du SMS")
  } finally {
    loading.value = null
  }
}
</script>

<template>
  <div class="flex gap-2">
    <button class="btn-secondary !bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100" :disabled="loading !== null" @click="sendWhatsapp">
      💬 {{ loading === 'whatsapp' ? '...' : 'WhatsApp' }}
    </button>
    <button class="btn-secondary" :disabled="loading !== null" @click="sendSms">
      ✉️ {{ loading === 'sms' ? 'Envoi...' : 'SMS' }}
    </button>
  </div>
</template>
