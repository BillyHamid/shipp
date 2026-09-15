<script setup lang="ts">
defineProps<{ type: 'success' | 'error'; message: string }>()
</script>

<template>
  <div
    class="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg shadow-ink-900/20 text-sm font-medium text-white toast-in"
    :class="type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
  >
    <Icon :icon="type === 'success' ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'" class="size-[18px] shrink-0" />
    {{ message }}
  </div>
</template>

<style scoped>
.toast-in {
  animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .toast-in { animation: none; }
}
</style>
