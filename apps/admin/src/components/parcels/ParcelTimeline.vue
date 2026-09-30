<script setup lang="ts">
import { formatDateTime } from '../../lib/format.js'

interface EventRow {
  id: string
  eventType: string
  action: string
  fromState: string | null
  toState: string | null
  occurredAt: string
  actor: { fullName: string }
  metadata?: { condition?: string; note?: string; photo?: string } | null
}

const CONDITION_LABELS: Record<string, string> = {
  conforme: 'Colis conforme',
  emballage_endommage: 'Emballage endommagé',
  ouvert_incomplet: 'Colis ouvert ou incomplet',
  humide_autre: 'Humide ou autre anomalie',
}

function eventLabel(evt: EventRow): string {
  if (evt.eventType === 'condition_checked') {
    return CONDITION_LABELS[evt.metadata?.condition ?? ''] ?? 'Contrôle d’état du colis'
  }
  if (evt.metadata?.photo && !evt.toState) return 'Photo enregistrée'
  return evt.toState ? STATE_LABELS[evt.toState] ?? evt.toState : evt.action
}

function hasIssue(evt: EventRow): boolean {
  return evt.eventType === 'condition_checked' && evt.metadata?.condition !== 'conforme'
}

function openPhoto(url?: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
      <div class="mt-1.5 size-2.5 rounded-full ring-4 shrink-0" :class="hasIssue(evt) ? 'bg-red-500 ring-red-50' : 'bg-brand-500 ring-brand-50'" />
      <div class="flex-1 pb-4 border-b border-ink-50 last:border-0 last:pb-0">
        <p class="text-sm font-medium" :class="hasIssue(evt) ? 'text-red-700' : 'text-ink-800'">{{ eventLabel(evt) }}</p>
        <p class="text-xs text-ink-500 mt-0.5">
          {{ formatDateTime(evt.occurredAt) }} · par {{ evt.actor.fullName }}
        </p>
        <p v-if="evt.metadata?.note" class="mt-2 text-sm text-ink-600">{{ evt.metadata.note }}</p>
        <img
          v-if="evt.metadata?.photo"
          :src="evt.metadata.photo"
          alt="Photo du contrôle du colis"
          class="mt-3 h-40 w-40 rounded-xl border border-ink-100 object-cover cursor-zoom-in"
          @click="openPhoto(evt.metadata?.photo)"
        />
      </div>
    </li>
  </ol>
</template>
