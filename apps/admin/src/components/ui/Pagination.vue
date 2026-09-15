<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ 'update:page': [number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 text-sm text-ink-500">
    <p>{{ from }}–{{ to }} sur {{ total }}</p>
    <div class="flex items-center gap-2">
      <button
        class="btn-secondary size-8 !px-0"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        <Icon icon="ph:caret-left-bold" class="size-4" />
      </button>
      <span class="px-1 text-ink-700 font-medium tabular-nums">{{ page }} / {{ totalPages }}</span>
      <button
        class="btn-secondary size-8 !px-0"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        <Icon icon="ph:caret-right-bold" class="size-4" />
      </button>
    </div>
  </div>
</template>
