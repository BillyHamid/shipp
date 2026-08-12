<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ state: string }>()

const STATE_LABELS: Record<string, string> = {
  registered: 'Enregistré',
  received_warehouse: 'Reçu entrepôt',
  preparing: 'En préparation',
  shipped: 'Expédié',
  in_transit: 'En transit',
  arrived_country: 'Arrivé pays',
  customs: 'Dédouanement',
  out_for_delivery: 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

const STATE_COLORS: Record<string, string> = {
  registered: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  received_warehouse: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  preparing: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  shipped: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  in_transit: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  arrived_country: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  customs: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  out_for_delivery: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/40',
}

const label = computed(() => STATE_LABELS[props.state] ?? props.state)
const color = computed(() => STATE_COLORS[props.state] ?? 'bg-slate-700 text-slate-300 border-slate-600')
</script>

<template>
  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="color">
    {{ label }}
  </span>
</template>
