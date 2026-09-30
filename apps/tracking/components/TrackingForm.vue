<script setup lang="ts">
const router = useRouter()

const value = ref('')
const error = ref<string | null>(null)

function onSubmit() {
  const trimmed = value.value.trim().toUpperCase()
  if (!trimmed) {
    error.value = null
    return
  }
  if (!/^GSG-[A-Z]{2}-[A-Z0-9]{6,10}$/.test(trimmed)) {
    error.value = 'Format invalide — ex: GSG-US-A4F2K9P1'
    return
  }
  error.value = null
  router.push(`/p/${trimmed}`)
}
</script>

<template>
  <form class="space-y-3" action="/p" method="get" @submit.prevent="onSubmit">
    <label for="tracking-number" class="sr-only">Numéro de suivi</label>
    <input
      id="tracking-number"
      :aria-invalid="!!error"
      :aria-describedby="error ? 'tracking-error' : undefined"
      v-model="value"
      name="trackingNumber"
      type="text"
      placeholder="ex: GSG-US-A4F2K9P1"
      autocapitalize="characters"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      class="input-tracking"
    />
    <p id="tracking-error" role="alert" v-if="error" class="text-sm text-red-500 px-1">{{ error }}</p>
    <button type="submit" class="btn-primary">
      <TrackIcon name="ph:magnifying-glass-bold" size="20" />
      Suivre mon colis
    </button>
  </form>
</template>
