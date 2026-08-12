<script setup lang="ts">
defineProps<{ type: 'success' | 'error'; message: string }>()
</script>

<template>
  <div
    class="fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white"
    :class="type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
  >
    {{ message }}
  </div>
</template>
