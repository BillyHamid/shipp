<script setup lang="ts">
const route = useRoute()
const trackingNumber = String(route.params.trackingNumber).toUpperCase()

const { data, error, refresh } = await useTracking(trackingNumber)

// Live updates: when the WS pushes a new state, just re-fetch the
// canonical snapshot rather than trying to patch the timeline client-side —
// simpler and always consistent with the server's source of truth.
useTrackingSocket(trackingNumber, () => refresh())

useSeoMeta({
  title: () => (data.value ? `Colis ${data.value.trackingNumber} — ${data.value.currentStateLabel}` : 'Suivi de colis'),
  description: 'Suivez votre colis GSG en temps réel',
  ogTitle: () => (data.value ? `Colis ${data.value.trackingNumber}` : 'Suivi de colis GSG'),
})
</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="max-w-lg mx-auto px-5 py-8">
      <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <Icon name="ph:arrow-left" size="16" />
        Rechercher un autre colis
      </NuxtLink>

      <!-- Not found -->
      <div v-if="error" class="text-center py-16">
        <div class="text-5xl mb-4">📭</div>
        <h2 class="text-lg font-semibold text-slate-900">Numéro de suivi introuvable</h2>
        <p class="text-sm text-slate-500 mt-1">Vérifiez le numéro et réessayez, ou contactez-nous.</p>
      </div>

      <!-- Result -->
      <div v-else-if="data" class="space-y-8">
        <div>
          <p class="text-xs text-slate-400 font-medium tracking-wide uppercase">Numéro de suivi</p>
          <p class="text-xl font-mono font-bold text-slate-900 mt-1">{{ data.trackingNumber }}</p>
          <p class="text-sm text-slate-500 mt-1">
            Pour <span class="font-medium text-slate-700">{{ data.recipientMasked }}</span>
            · {{ data.originCountry }} → {{ data.destCountry }}
          </p>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-3">
          <StatusBadge :state="data.currentState" :label="data.currentStateLabel" />
          <div v-if="data.estimatedDelivery" class="text-right">
            <p class="text-xs text-slate-400">Livraison estimée</p>
            <p class="text-sm font-semibold text-slate-700">
              {{ new Date(data.estimatedDelivery).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }}
            </p>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-8">
          <TrackingTimeline :steps="data.timeline" :current-state="data.currentState" />
        </div>

        <div class="border-t border-slate-100 pt-6">
          <ShareButtons :tracking-number="data.trackingNumber" />
        </div>
      </div>
    </div>
  </main>
</template>
