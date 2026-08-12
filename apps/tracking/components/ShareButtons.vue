<script setup lang="ts">
const props = defineProps<{ trackingNumber: string }>()

const copied = ref(false)

// useRequestURL() resolves consistently on both server (from the incoming
// request) and client (matches window.location) — branching on
// import.meta.client here instead caused an SSR/client hydration mismatch,
// since the server would render a hardcoded fallback domain while the
// client immediately overwrote it with window.location.href.
const requestUrl = useRequestURL()
const shareUrl = computed(() => `${requestUrl.origin}/p/${props.trackingNumber}`)

const whatsappUrl = computed(() => {
  const text = encodeURIComponent(`Suivez mon colis GSG : ${shareUrl.value}`)
  return `https://wa.me/?text=${text}`
})

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="flex gap-3">
    <a
      :href="whatsappUrl"
      target="_blank"
      rel="noopener"
      class="flex-1 h-12 rounded-xl bg-emerald-500 text-white text-sm font-medium
             flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
    >
      <Icon name="ph:whatsapp-logo-fill" size="18" />
      Partager sur WhatsApp
    </a>
    <button
      class="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium
             flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
      @click="copyLink"
    >
      <Icon :name="copied ? 'ph:check-bold' : 'ph:link'" size="18" />
      {{ copied ? 'Copié !' : 'Copier le lien' }}
    </button>
  </div>
</template>
