<script setup lang="ts">
import { formatDateTime } from '../../lib/format.js'

interface EventRow {
  id: string
  action: string
  fromState: string | null
  toState: string | null
  occurredAt: string
  actor: { fullName: string }
}

defineProps<{ events: EventRow[] }>()

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
</script>

<template>
  <ol class="space-y-4">
    <li v-for="evt in events" :key="evt.id" class="flex gap-3">
      <div class="mt-1.5 size-2.5 rounded-full bg-brand-500 ring-4 ring-brand-50 shrink-0" />
      <div class="flex-1 pb-4 border-b border-ink-50 last:border-0 last:pb-0">
        <p class="text-sm font-medium text-ink-800">
          {{ evt.toState ? STATE_LABELS[evt.toState] ?? evt.toState : evt.action }}
        </p>
        <p class="text-xs text-ink-500 mt-0.5">
          {{ formatDateTime(evt.occurredAt) }} · par {{ evt.actor.fullName }}
        </p>
      </div>
    </li>
  </ol>
</template>
