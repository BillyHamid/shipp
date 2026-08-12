<script setup lang="ts">
defineProps<{ icon: string; message: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
    <div class="card w-full max-w-sm space-y-4">
      <div class="text-center">
        <div class="text-4xl mb-2">{{ icon }}</div>
        <p class="text-slate-200">{{ message }}</p>
      </div>
      <slot />
      <button class="btn-primary" @click="emit('confirm')">Confirmer</button>
      <button class="btn-secondary" @click="emit('cancel')">Annuler</button>
    </div>
  </div>
</template>
