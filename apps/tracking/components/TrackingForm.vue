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
  <form class="space-y-3" @submit.prevent="onSubmit">
    <input
      v-model="value"
      type="text"
      placeholder="ex: GSG-US-A4F2K9P1"
      autocapitalize="characters"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      class="input-tracking"
    />
    <p v-if="error" class="text-sm text-red-500 px-1">{{ error }}</p>
    <button type="submit" class="btn-primary">
      <Icon name="ph:magnifying-glass-bold" size="20" />
      Suivre mon colis
    </button>
  </form>
</template>
