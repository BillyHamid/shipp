<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ 'update:page': [number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 text-sm text-slate-500">
    <p>{{ from }}–{{ to }} sur {{ total }}</p>
    <div class="flex gap-2">
      <button
        class="btn-secondary h-8 px-3"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        ←
      </button>
      <span class="px-2 py-1 text-slate-600">{{ page }} / {{ totalPages }}</span>
      <button
        class="btn-secondary h-8 px-3"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        →
      </button>
    </div>
  </div>
</template>
