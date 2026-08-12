<script setup lang="ts">
const props = defineProps<{ state: string; label: string }>()

const COLORS: Record<string, string> = {
  registered: 'bg-sky-50 text-sky-700 ring-sky-200',
  received_warehouse: 'bg-sky-50 text-sky-700 ring-sky-200',
  preparing: 'bg-amber-50 text-amber-700 ring-amber-200',
  shipped: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_transit: 'bg-amber-50 text-amber-700 ring-amber-200',
  arrived_country: 'bg-violet-50 text-violet-700 ring-violet-200',
  customs: 'bg-violet-50 text-violet-700 ring-violet-200',
  out_for_delivery: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const color = computed(() => COLORS[props.state] ?? 'bg-slate-100 text-slate-700 ring-slate-200')
</script>

<template>
  <span class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ring-1" :class="color">
    <span class="size-2 rounded-full bg-current mr-2" />
    {{ label }}
  </span>
</template>
