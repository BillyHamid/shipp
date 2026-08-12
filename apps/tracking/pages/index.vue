<script setup lang="ts">
useSeoMeta({
  title: 'GSGLOGISTIQUE — Suivi de colis',
  description: 'Suivez votre colis GSG en temps réel entre les USA et le Burkina Faso',
  ogTitle: 'GSGLOGISTIQUE — Suivi de colis',
  ogDescription: 'Saisissez votre numéro de suivi pour voir où en est votre envoi',
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white flex flex-col">
    <header class="px-6 pt-14 pb-10 text-center">
      <div class="mx-auto size-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
        GSG
      </div>
      <h1 class="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
        Suivez votre colis
      </h1>
      <p class="mt-2 text-slate-500 max-w-sm mx-auto">
        Saisissez votre numéro de suivi pour voir où en est votre envoi
      </p>
    </header>

    <section class="px-6 max-w-md w-full mx-auto flex-1">
      <TrackingForm />
    </section>

    <footer class="mt-16 px-6 pb-10 text-center">
      <p class="text-xs text-slate-400">
        Une question ? Contactez-nous au
        <a href="tel:+13473210379" class="text-brand-600 font-medium">+1 (347) 321-0379</a>
      </p>
      <p class="text-xs text-slate-300 mt-2">GLOBAL SHIPPING GROUP LLC</p>
    </footer>
  </main>
</template>
