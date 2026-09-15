<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="card w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl shadow-ink-900/10">
      <div class="flex items-center justify-between px-5 h-14 border-b border-ink-50 shrink-0">
        <h3 class="font-display font-bold text-ink-900">{{ title }}</h3>
        <button
          class="size-8 rounded-lg flex items-center justify-center text-ink-300 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          @click="emit('close')"
        >
          <Icon icon="ph:x-bold" class="size-4" />
        </button>
      </div>
      <div class="p-5 overflow-y-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
