<script setup lang="ts">
const route = useRoute()
const trackingNumber = String(route.params.trackingNumber).toUpperCase()

const { data, error, refresh } = await useTracking(trackingNumber)

// Live updates: when the WS pushes a new state, just re-fetch the
// canonical snapshot rather than trying to patch the timeline client-side —
// simpler and always consistent with the server's source of truth.
const { connected } = useTrackingSocket(trackingNumber, () => refresh())
const completed = computed(() => data.value?.timeline.filter(step => step.done).length ?? 0)
const totalSteps = computed(() => data.value?.timeline.length ?? 0)
const progress = computed(() => totalSteps.value ? Math.round(completed.value / totalSteps.value * 100) : 0)

useSeoMeta({
  title: () => (data.value ? `Colis ${data.value.trackingNumber} — ${data.value.currentStateLabel}` : 'Suivi de colis'),
  description: 'Suivez votre colis GSG en temps réel',
  ogTitle: () => (data.value ? `Colis ${data.value.trackingNumber}` : 'Suivi de colis GSG'),
})

const COUNTRY_LABELS: Record<string, string> = {
  US: 'États-Unis', BF: 'Burkina Faso', CI: "Côte d'Ivoire", ML: 'Mali', SN: 'Sénégal',
  TG: 'Togo', BJ: 'Bénin', GH: 'Ghana', NE: 'Niger', GN: 'Guinée', FR: 'France',
}
function countryLabel(code: string): string {
  return COUNTRY_LABELS[code] ?? code
}
</script>

<template>
  <main class="min-h-screen bg-ink-50">
    <!-- Status header -->
    <div class="bg-[#f5f4ee] border-b border-ink-100 relative overflow-hidden">
      <div class="absolute -top-20 -right-10 size-72 rounded-full bg-accent-500/10 blur-3xl" aria-hidden="true" />
      <div class="relative max-w-4xl mx-auto px-5 pt-6 pb-10 sm:pt-8 sm:pb-14">
        <div class="flex items-center justify-between mb-8">
          <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-accent-700 transition-colors">
            <TrackIcon name="ph:arrow-left-bold" size="16" />
            Rechercher un autre colis
          </NuxtLink>
          <img src="/logo.jpg" alt="Global Shipping Group" class="h-9 w-auto rounded-lg bg-white px-1.5 py-1" />
        </div>

        <template v-if="data">
          <p class="reveal reveal-1 text-xs font-medium text-ink-500 uppercase tracking-wider">Numéro de suivi</p>
          <p class="reveal reveal-2 text-2xl sm:text-3xl font-display font-extrabold text-ink-900 font-mono tracking-tight mt-1">
            {{ data.trackingNumber }}
          </p>
          <div class="reveal reveal-3 mt-4">
            <StatusBadge :state="data.currentState" :label="data.currentStateLabel" />
          </div>
        </template>
        <template v-else>
          <p class="text-xl font-display font-bold text-ink-900">Suivi de colis</p>
        </template>
      </div>
    </div>

    <div class="max-w-3xl mx-auto relative px-5 -mt-6 sm:-mt-8 pb-16">
      <!-- Not found -->
      <div v-if="error" class="bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-ink-100 text-center py-16 px-6">
        <div class="size-16 rounded-2xl bg-ink-50 flex items-center justify-center text-ink-500 mx-auto mb-5">
          <TrackIcon name="ph:package-bold" size="30" />
        </div>
        <h2 class="font-display text-lg font-bold text-ink-900">{{ error.statusCode === 404 ? 'Numéro de suivi introuvable' : 'Le suivi est momentanément indisponible' }}</h2>
        <p class="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
          Vérifiez le numéro et réessayez, ou contactez-nous au
          <a href="tel:+13473210379" class="text-accent-600 font-medium">+1 (347) 321-0379</a>.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 mt-6 h-12 px-6 rounded-2xl bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition-colors"
        >
          Rechercher un colis
        </NuxtLink>
      </div>

      <!-- Result -->
      <div v-else-if="data" class="space-y-5">
        <section class="reveal reveal-3 bg-white rounded-3xl border border-ink-100 p-6 sm:p-8 shadow-xl shadow-black/5"><p class="tracking-kicker text-accent-600 mb-3">Votre envoi, étape par étape</p><h1 class="font-display text-3xl font-extrabold tracking-tight text-ink-900">{{ data.currentStateLabel }}</h1><p class="text-sm text-ink-500 mt-3">{{ data.currentState === 'delivered' ? 'Votre colis est arrivé au terme de son voyage.' : data.currentState === 'cancelled' ? 'Cet envoi a été annulé. Contactez votre agence pour plus d’informations.' : 'Retrouvez ci-dessous les dernières étapes enregistrées par notre équipe.' }}</p><template v-if="data.currentState !== 'cancelled'"><div class="flex justify-between text-xs text-ink-500 mt-6 mb-3"><span>Progression du parcours</span><span>{{ completed }} / {{ totalSteps }} étapes</span></div><div role="progressbar" aria-label="Étapes réalisées" :aria-valuenow="completed" :aria-valuemax="totalSteps" :aria-valuemin="0" class="h-2 rounded-full bg-ink-50 overflow-hidden"><div class="h-full bg-accent-500 rounded-full transition-all duration-700" :style="{ width: progress + '%' }"></div></div></template></section>
        <!-- Summary card -->
        <div class="reveal reveal-4 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-ink-100 p-6 sm:p-7">
          <div class="flex items-center justify-between flex-wrap gap-6">
            <div class="flex items-center gap-4">
              <div class="text-center">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Origine</p>
                <p class="font-display font-bold text-ink-900 mt-0.5">{{ countryLabel(data.originCountry) }}</p>
              </div>
              <TrackIcon name="ph:arrow-right-bold" size="18" class="text-accent-500" />
              <div class="text-center">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Destination</p>
                <p class="font-display font-bold text-ink-900 mt-0.5">{{ countryLabel(data.destCountry) }}</p>
              </div>
            </div>
            <div v-if="data.estimatedDelivery" class="text-right">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Livraison estimée</p>
              <p class="font-display font-bold text-ink-900 mt-0.5">
                {{ new Date(data.estimatedDelivery).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }}
              </p>
            </div>
          </div>
          <p class="text-sm text-slate-500 mt-4 pt-4 border-t border-ink-50">
            Destinataire : <span class="font-medium text-ink-700">{{ data.recipientMasked }}</span>
          </p>
        </div>

        <!-- Timeline card -->
        <div class="reveal reveal-5 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-ink-100 p-6 sm:p-7">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-display font-bold text-ink-900">Parcours du colis</h2>
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1">
              <span class="size-1.5 rounded-full bg-emerald-500" />
              {{ connected ? 'Connecté en direct' : 'Dernier état connu' }}
            </span>
          </div>
          <TrackingTimeline :steps="data.timeline" :current-state="data.currentState" />
        </div>

        <!-- Share -->
        <div class="reveal reveal-6 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-ink-100 p-6 sm:p-7">
          <ShareButtons :tracking-number="data.trackingNumber" />
        </div>
      </div>
    </div>
  </main>
</template>
