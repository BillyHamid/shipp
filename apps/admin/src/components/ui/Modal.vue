<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
    <div class="card w-full max-w-lg max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between px-5 h-14 border-b border-slate-100">
        <h3 class="font-semibold text-slate-800">{{ title }}</h3>
        <button class="text-slate-400 hover:text-slate-700" @click="emit('close')">✕</button>
      </div>
      <div class="p-5 overflow-y-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
