<script setup lang="ts">
import type { PublicTimelineStep } from '../composables/useTracking.js'

defineProps<{ steps: PublicTimelineStep[]; currentState: string }>()

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <ol class="relative">
    <li v-for="(step, i) in steps" :key="step.state" class="relative pb-8 last:pb-0 pl-10">
      <!-- connector line -->
      <span
        v-if="i !== steps.length - 1"
        class="absolute left-[15px] top-8 bottom-0 w-0.5"
        :class="step.done ? 'bg-brand-500' : 'bg-slate-200'"
      />

      <!-- dot -->
      <span
        class="absolute left-0 top-0.5 flex items-center justify-center size-8 rounded-full ring-4 ring-white transition-colors"
        :class="[
          step.done ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400',
          step.state === currentState && !step.done ? 'animate-pulse' : '',
        ]"
      >
        <Icon v-if="step.done" name="ph:check-bold" size="16" />
        <span v-else class="size-2 rounded-full bg-current" />
      </span>

      <div class="pt-0.5">
        <p
          class="font-medium"
          :class="step.done ? 'text-slate-900' : 'text-slate-400'"
        >
          {{ step.label }}
        </p>
        <p v-if="step.occurredAt" class="text-sm text-slate-500 mt-0.5">
          {{ formatDate(step.occurredAt) }}
        </p>
        <p
          v-else-if="step.state === currentState"
          class="text-sm text-brand-600 font-medium mt-0.5"
        >
          ← maintenant
        </p>
      </div>
    </li>
  </ol>
</template>
