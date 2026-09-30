<script setup lang="ts">
import type { PublicTimelineStep } from '../composables/useTracking.js'

defineProps<{ steps: PublicTimelineStep[]; currentState: string }>()

const STEP_ICONS: Record<string, string> = {
  registered: 'ph:package-bold',
  received_warehouse: 'ph:warehouse-bold',
  preparing: 'ph:archive-box-bold',
  shipped: 'ph:airplane-tilt-bold',
  in_transit: 'ph:navigation-arrow-bold',
  arrived_country: 'ph:map-pin-bold',
  customs: 'ph:shield-check-bold',
  out_for_delivery: 'ph:truck-bold',
  delivered: 'ph:check-circle-bold',
}

function iconFor(state: string): string {
  return STEP_ICONS[state] ?? 'ph:circle-bold'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <ol class="relative">
    <li
      v-for="(step, i) in steps"
      :key="step.state"
      class="step relative pb-9 last:pb-0 pl-14"
      :style="{ animationDelay: `${i * 90}ms` }"
    >
      <!-- connector line — the segment leaving the current step "flows" toward what's next -->
      <span
        v-if="i !== steps.length - 1"
        class="absolute left-[19px] top-11 bottom-0 w-0.5 overflow-hidden rounded-full"
        :class="step.done ? 'bg-accent-500' : 'bg-ink-100'"
      >
        <span v-if="step.state === currentState" class="connector-flow absolute inset-0" />
      </span>

      <!-- icon -->
      <span
        class="absolute left-0 top-0 flex items-center justify-center rounded-full ring-4 ring-white transition-all"
        :class="[
          step.state === currentState
            ? 'size-11 bg-accent-500 text-ink-900 pulse-ring'
            : step.done
              ? 'size-10 bg-ink-900 text-accent-400'
              : 'size-10 bg-ink-50 text-ink-300',
        ]"
      >
        <TrackIcon :name="iconFor(step.state)" size="18" />
      </span>

      <div class="pt-1.5" :class="step.state === currentState ? 'pl-1' : ''">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-display font-bold" :class="step.done ? 'text-ink-900' : 'text-ink-300'">
            {{ step.label }}
          </p>
          <span
            v-if="step.state === currentState"
            class="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-accent-600 bg-accent-50 rounded-full px-2 py-0.5"
          >
            <span class="size-1.5 rounded-full bg-accent-500 animate-pulse" />
            {{ currentState === 'delivered' ? 'Livré' : 'Étape actuelle' }}
          </span>
        </div>
        <p v-if="step.occurredAt" class="text-sm text-slate-500 mt-0.5">
          {{ formatDate(step.occurredAt) }}
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.step {
  opacity: 0;
  animation: step-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes step-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(112, 211, 194, 0.45); }
  70% { box-shadow: 0 0 0 10px rgba(112, 211, 194, 0); }
  100% { box-shadow: 0 0 0 0 rgba(112, 211, 194, 0); }
}

.connector-flow {
  background: linear-gradient(
    to bottom,
    theme('colors.accent.500') 0%,
    theme('colors.accent.400') 50%,
    theme('colors.accent.500') 100%
  );
  background-size: 100% 200%;
  animation: connector-flow 1.6s linear infinite;
}

@keyframes connector-flow {
  from { background-position: 0 0; }
  to { background-position: 0 -200%; }
}

@media (prefers-reduced-motion: reduce) {
  .step {
    opacity: 1;
    animation: none;
  }
  .pulse-ring,
  .connector-flow {
    animation: none;
  }
}
</style>
