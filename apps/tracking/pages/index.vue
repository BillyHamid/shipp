<script setup lang="ts">
useSeoMeta({
  title: 'GSGLOGISTIQUE — Suivi de colis USA ⇄ Afrique de l\'Ouest',
  description: 'Transport de colis fiable entre les États-Unis et l\'Afrique de l\'Ouest. Suivez votre envoi en temps réel, où que vous soyez.',
  ogTitle: 'GSGLOGISTIQUE — Suivi de colis',
  ogDescription: 'Saisissez votre numéro de suivi pour voir où en est votre envoi',
})

const destinations = [
  { code: 'BF', flag: '🇧🇫', label: 'Burkina Faso' },
  { code: 'CI', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { code: 'ML', flag: '🇲🇱', label: 'Mali' },
  { code: 'SN', flag: '🇸🇳', label: 'Sénégal' },
  { code: 'TG', flag: '🇹🇬', label: 'Togo' },
  { code: 'BJ', flag: '🇧🇯', label: 'Bénin' },
  { code: 'GH', flag: '🇬🇭', label: 'Ghana' },
  { code: 'NE', flag: '🇳🇪', label: 'Niger' },
  { code: 'GN', flag: '🇬🇳', label: 'Guinée' },
]

const steps = [
  {
    icon: 'ph:package-bold',
    title: 'Enregistrement',
    text: "Le colis est enregistré et reçoit un numéro de suivi unique, associé à un QR code.",
  },
  {
    icon: 'ph:airplane-tilt-bold',
    title: 'Transit international',
    text: 'Groupé dans un envoi, il traverse l\'Atlantique jusqu\'à son pays de destination.',
  },
  {
    icon: 'ph:handshake-bold',
    title: 'Livraison',
    text: 'Après le dédouanement, votre colis est mis à disposition pour la livraison ou le retrait.',
  },
]

const features = [
  { icon: 'ph:broadcast-bold', title: 'Suivi en temps réel', text: "L'état de votre colis se met à jour en direct, sans avoir à rappeler l'agence." },
  { icon: 'ph:chat-circle-dots-bold', title: 'Notifications SMS & WhatsApp', text: 'Votre agence peut vous transmettre les informations de suivi par SMS ou WhatsApp.' },
  { icon: 'ph:globe-hemisphere-west-bold', title: 'Réseau USA ⇄ Afrique', text: "Un corridor logistique dédié entre les États-Unis et l'Afrique de l'Ouest." },
  { icon: 'ph:shield-check-bold', title: 'Fiable et tracé', text: 'Chaque étape est horodatée et vérifiable — aucune zone d\'ombre sur le trajet.' },
]

const activeScene = ref(0)
const motionPaused = ref(false)
const reducedMotion = ref(true)
const scenes = [
  { title: 'Chaque voyage commence avec soin.', label: 'Préparation', image: '/images/warehouse-preparation.jpg', alt: 'Préparation d’un colis en entrepôt', position: '50% 46%' },
  { title: 'Le lien continue, au-delà des frontières.', label: 'Acheminement', image: '/images/parcel-delivery.jpg', alt: 'Acheminement de colis vers un véhicule', position: '72% 50%' },
]
let sceneTimer: ReturnType<typeof setInterval> | undefined
let motionQuery: MediaQueryList | undefined
function updateMotion() { reducedMotion.value = motionQuery?.matches ?? true }
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionQuery.addEventListener('change', updateMotion)
  sceneTimer = setInterval(() => { if (!motionPaused.value && !reducedMotion.value) activeScene.value = (activeScene.value + 1) % scenes.length }, 6500)
})
onBeforeUnmount(() => { clearInterval(sceneTimer); motionQuery?.removeEventListener('change', updateMotion) })
</script>

<template>
  <div id="top" class="bg-[#fafbf9]">
    <section class="tracking-hero text-ink-900">
      <header class="relative tracking-shell h-24 flex items-center justify-between border-b border-ink-100"><NuxtLink to="/" class="flex items-center gap-3"><img src="/logo.jpg" alt="GSG Logistique" class="h-11 w-14 object-contain bg-white rounded-xl p-1" /><span class="font-bold text-sm tracking-wide">GSG<span class="text-accent-700">.</span><span class="block text-[8px] tracking-[.2em] text-ink-500 mt-1">GLOBAL SHIPPING GROUP</span></span></NuxtLink><nav class="flex items-center gap-7 text-xs"><a href="#parcours" class="hidden md:block text-ink-500 hover:text-accent-700">Le parcours de votre colis</a><a href="tel:+13473210379" class="border border-ink-100 rounded-full px-4 py-2.5 hover:bg-accent-50 flex items-center gap-2"><TrackIcon name="ph:phone" size="16" />Nous contacter</a></nav></header>
      <div class="arrival-hero tracking-shell">
        <div class="arrival-copy"><p class="tracking-kicker text-accent-700 arrival-eyebrow"><span></span>USA ↔ Afrique de l’Ouest</p><h1 class="arrival-title font-display">Vos colis<br />voyagent.<br /><span>Le lien reste.</span></h1><p class="arrival-description">Pour ce qui compte. Pour ceux qui comptent.<br />Gardez le lien avec votre envoi, à chaque étape.</p><a href="#suivre" class="arrival-link">Retrouver mon colis <span aria-hidden="true">↘</span></a></div>
        <figure class="arrival-visual" :class="{ 'motion-paused': motionPaused || reducedMotion }"><div class="hero-scene-images" aria-hidden="true"><img v-for="(scene,i) in scenes" :key="scene.image" :src="scene.image" alt="" width="900" height="1372" :fetchpriority="i === 0 ? 'high' : 'auto'" decoding="async" class="hero-scene-image" :class="{ 'is-active': activeScene === i }" :style="{ objectPosition: scene.position }" /></div><div class="arrival-photo-veil"></div><button type="button" class="hero-motion-button arrival-pause" :aria-label="motionPaused ? 'Reprendre le diaporama' : 'Mettre le diaporama en pause'" :aria-pressed="motionPaused" @click="motionPaused = !motionPaused">{{ motionPaused ? '▶' : 'Ⅱ' }}</button><figcaption class="arrival-caption"><span class="tracking-kicker">Le voyage de vos colis</span><p>{{ scenes[activeScene]?.label }}</p><div class="arrival-dots"><button v-for="(scene,i) in scenes" :key="scene.label" :aria-label="'Afficher : ' + scene.label" :aria-pressed="activeScene === i" :class="{ active: activeScene === i }" @click="activeScene = i; motionPaused = true"></button></div><small>Photographies d’illustration · Pexels</small></figcaption></figure>
        <div class="arrival-flight" aria-hidden="true"><svg viewBox="0 0 200 140" fill="none"><path d="M8 127C25 10 147 150 181 15" stroke="#c62832" stroke-width="1.5" stroke-dasharray="4 7" class="arrival-dash" /><g transform="translate(163 10) rotate(-15)"><path d="m0 14 11 2 4 13 4-1 1-12 12-11-3-4-14 9-10-2-5 6Z" fill="#c62832" /></g></svg><div class="arrival-parcel"><svg viewBox="0 0 40 40" fill="none"><path d="m20 3 16 9v17l-16 9-16-9V12L20 3Z" fill="#f3dfbd" stroke="#91603d" stroke-width="1.3" /><path d="m4 12 16 9 16-9M20 21v17M12 7l16 9v8" stroke="#91603d" stroke-width="1.3" /><path d="m9 23 6 3v5l-6-3z" fill="#c62832" /></svg></div></div>
      </div>
      <div class="tracking-shell arrival-search-wrap"><div id="suivre" class="arrival-search"><div class="arrival-search-heading"><span class="tracking-kicker text-accent-700">Votre voyage, en un clic</span><h2>Où en est votre colis ?</h2></div><TrackingForm /><p class="arrival-search-note"><TrackIcon name="ph:lock-key" size="12" />Sans compte · Votre numéro figure sur le reçu d’envoi.</p></div></div>
      <div class="relative border-t border-ink-100"><div class="tracking-shell py-5 flex flex-wrap items-center justify-between gap-4 text-[11px] text-ink-500"><span class="tracking-kicker !text-[9px]">Un réseau, des liens</span><span>États-Unis <span class="text-accent-700 mx-3">↔</span> Afrique de l’Ouest</span><span class="hidden sm:block">Express & Cargo</span></div></div>
    </section>
    <div class="tracking-shell arrival-journey"><ParcelJourney /></div>
    <section id="parcours" class="tracking-shell py-16 sm:py-24"><div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10"><div><p class="tracking-kicker text-accent-600 mb-3">Le voyage, en toute clarté</p><h2 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">Chaque étape compte.</h2></div><p class="text-sm text-ink-500 max-w-sm leading-relaxed">Du premier enregistrement à la remise du colis, un historique pour savoir où vous en êtes.</p></div><div class="grid sm:grid-cols-3 gap-5"><article v-for="(step,i) in steps" :key="step.title" class="service-card rounded-2xl p-6 sm:p-8 border border-ink-100 bg-white"><div class="flex justify-between items-center mb-8"><TrackIcon :name="step.icon" size="26" class="text-accent-600" /><span class="text-xs font-mono text-ink-500">0{{ i+1 }} / 03</span></div><h3 class="font-display text-lg font-bold text-ink-900">{{ step.title }}</h3><p class="text-sm leading-relaxed text-ink-500 mt-3">{{ step.text }}</p></article></div></section>
<section class="tracking-shell pb-16 sm:pb-24"><div class="logistics-story"><figure><img src="/images/parcel-delivery.jpg" alt="Un professionnel transporte des colis vers un véhicule de livraison" width="900" height="600" loading="lazy" decoding="async" /><figcaption>Photographie d’illustration · Tima Miroshnichenko / Pexels</figcaption></figure><div class="p-7 sm:p-10 lg:p-12 flex flex-col justify-center"><p class="tracking-kicker text-accent-600 mb-4">Bien plus qu’un carton</p><h2 class="font-display text-3xl font-extrabold tracking-tight text-ink-900">Ce qui compte pour vous<br />mérite toute l’attention.</h2><p class="text-sm text-ink-500 leading-relaxed mt-5">Un cadeau pour un proche, des affaires personnelles ou un envoi professionnel : derrière chaque colis, il y a une attente.</p><p class="text-sm text-ink-500 leading-relaxed mt-3">Avec votre numéro de suivi, gardez le lien avec votre envoi et retrouvez les étapes enregistrées par votre agence.</p><a href="#suivre" class="inline-flex items-center gap-3 text-sm font-bold text-accent-700 mt-7">Suivre mon colis <TrackIcon name="ph:arrow-up-right" size="18" /></a></div></div></section>
    <section class="bg-ink-50 border-y border-ink-100"><div class="tracking-shell py-16 grid md:grid-cols-[1fr_1.1fr] gap-12 items-center"><div><p class="tracking-kicker text-accent-600 mb-4">L’essentiel, au bon moment</p><h2 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">Moins d’incertitude.<br />Plus de tranquillité.</h2><p class="mt-5 text-sm text-ink-500 leading-relaxed max-w-sm">Consultez le statut, retrouvez l’historique et partagez le suivi avec la personne qui attend votre colis.</p><a href="#suivre" class="inline-flex mt-7 items-center gap-3 text-sm font-bold text-accent-700">Retrouver mon envoi <TrackIcon name="ph:arrow-up-right" size="18" /></a></div><div class="grid sm:grid-cols-2 gap-5"><div v-for="feature in features" :key="feature.title" class="border-t border-ink-100 pt-5"><TrackIcon :name="feature.icon" size="22" class="text-accent-600 mb-3" /><h3 class="font-bold text-sm text-ink-900">{{ feature.title }}</h3><p class="mt-2 text-xs leading-relaxed text-ink-500">{{ feature.text }}</p></div></div></div></section>
    <section class="tracking-shell py-16"><div class="rounded-3xl bg-[#fff1f2] border border-[#f3d6d9] p-7 sm:p-12 flex flex-col sm:flex-row justify-between gap-7 sm:items-center"><div><p class="tracking-kicker text-accent-700 mb-3">Nous sommes à vos côtés</p><h2 class="text-ink-900 text-2xl font-display font-bold tracking-tight">Une question sur votre envoi ?</h2><p class="text-ink-500 text-sm mt-3">Notre équipe vous accompagne pour la suite du voyage.</p></div><a href="tel:+13473210379" class="shrink-0 flex items-center justify-center gap-3 bg-accent-600 text-white rounded-xl px-5 h-14 font-bold text-sm hover:bg-accent-700"><TrackIcon name="ph:phone" size="18" />+1 (347) 321-0379</a></div></section>
    <footer class="tracking-shell pb-8 flex flex-wrap gap-3 items-center justify-between text-[11px] text-ink-500"><span>© {{ new Date().getFullYear() }} Global Shipping Group</span><a href="https://www.pexels.com/@tima-miroshnichenko/" target="_blank" rel="noopener noreferrer" class="hover:text-accent-700">Photographies : Tima Miroshnichenko / Pexels</a><a href="#top" class="hover:text-accent-700">Retour en haut ↑</a></footer>
  </div>
</template>
