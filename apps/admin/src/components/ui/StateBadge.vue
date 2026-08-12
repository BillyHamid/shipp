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
  pending: 'En attente',
  paid: 'Payé',
  refunded: 'Remboursé',
  waived: 'Offert',
  open: 'Ouverte',
  arrived: 'Arrivée',
  closed: 'Fermée',
}

const STATE_COLORS: Record<string, string> = {
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
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  refunded: 'bg-red-50 text-red-700 ring-red-200',
  waived: 'bg-slate-100 text-slate-600 ring-slate-200',
  open: 'bg-sky-50 text-sky-700 ring-sky-200',
  arrived: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const label = computed(() => STATE_LABELS[props.state] ?? props.state)
const color = computed(() => STATE_COLORS[props.state] ?? 'bg-slate-100 text-slate-600 ring-slate-200')
</script>

<template>
  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 whitespace-nowrap" :class="color">
    {{ label }}
  </span>
</template>
