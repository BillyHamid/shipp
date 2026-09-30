<script setup lang="ts">
const paused = ref(false)
</script>
<template>
  <div class="parcel-journey" :class="{ 'journey-paused': paused }">
    <div class="journey-heading"><span>Le voyage d’un colis</span><button type="button" :aria-pressed="paused" :aria-label="paused ? 'Reprendre l’animation du trajet' : 'Mettre le trajet en pause'" @click="paused = !paused">{{ paused ? '▶' : 'Ⅱ' }}</button></div>
    <div class="journey-stage" aria-hidden="true">
      <svg class="journey-route" viewBox="0 0 440 100" preserveAspectRatio="none"><path d="M35 65 C110 65 130 25 220 25 S340 65 405 65" fill="none" stroke="#e9d9da" stroke-width="2" /><path class="journey-dashes" d="M35 65 C110 65 130 25 220 25 S340 65 405 65" fill="none" stroke="#c62832" stroke-width="2" stroke-dasharray="3 10" /></svg>
      <div class="journey-station journey-origin"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 13 13-8 13 8v15H3V13Zm7 15V16h12v12M10 20h12M10 24h12" /></svg></div>
      <div class="journey-station journey-plane"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 17 10 2 3 10 3-1 1-10 9-10-2-3-11 8-9-1-4 5Z" /></svg></div>
      <div class="journey-station journey-destination"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M25 12c0 8-9 17-9 17S7 20 7 12a9 9 0 0 1 18 0Z" /><path d="m12 12 3 3 5-6" /></svg></div>
      <div class="travelling-parcel"><svg viewBox="0 0 40 40" fill="none"><path d="m20 3 16 9v17l-16 9-16-9V12L20 3Z" fill="#fff8ed" stroke="#b86a38" stroke-width="1.5" /><path d="m4 12 16 9 16-9M20 21v17M12 7l16 9v8l-5 3v-8L7 10" stroke="#b86a38" stroke-width="1.5" /><path d="m9 24 6 3" stroke="#c62832" stroke-width="2" /></svg></div>
    </div>
    <div class="journey-labels"><span>Prise en charge</span><span>Transport</span><span>Destination</span></div>
    <p class="journey-note">Illustration du parcours · Consultez votre suivi pour l’état réel.</p>
  </div>
</template>
<style scoped>
.parcel-journey { margin-top: 26px; max-width: 512px; border-top: 1px solid #e9dfe0; padding-top: 15px; }
.journey-heading { display: flex; align-items: center; justify-content: space-between; color: #73666a; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.journey-heading button { width: 32px; height: 32px; border: 1px solid #eadfe0; border-radius: 50%; color: #a61d29; background: white; }
.journey-stage { position: relative; height: 100px; margin: 3px 15px 0; }
.journey-route { width: 100%; height: 100%; position: absolute; inset: 0; }
.journey-station { position: absolute; width: 37px; height: 37px; padding: 7px; border-radius: 12px; border: 1px solid #eadcdd; background: #fff; color: #a61d29; z-index: 1; }
.journey-station svg { width: 100%; height: 100%; }
.journey-origin { left: 3%; top: 45px; }
.journey-plane { left: calc(50% - 18px); top: 0; animation: flight-bob 4s ease-in-out infinite; }
.journey-destination { right: 3%; top: 45px; }
.travelling-parcel { position: absolute; width: 35px; height: 35px; top: 47px; left: 6%; z-index: 2; filter: drop-shadow(0 5px 4px #54322420); animation: parcel-trip 9s ease-in-out infinite; }
.journey-dashes { animation: route-dashes 8s linear infinite; }
.journey-labels { display: flex; justify-content: space-between; color: #514047; font-size: 10px; font-weight: 600; margin-top: 2px; }
.journey-note { font-size: 9px; color: #73666a; margin-top: 11px; }
.journey-paused *, .journey-paused svg { animation-play-state: paused !important; }
@keyframes parcel-trip { 0%,8% { left: 5%; top: 47px; opacity: 0; transform: scale(.85); } 14% { opacity: 1; transform: scale(1); } 45%,55% { left: calc(50% - 17px); top: 20px; opacity: 1; transform: rotate(-7deg); } 83%,92% { left: calc(94% - 35px); top: 47px; opacity: 1; transform: rotate(0); } 100% { left: calc(94% - 35px); top: 47px; opacity: 0; transform: scale(.85); } }
@keyframes flight-bob { 50% { transform: translateY(-4px) rotate(5deg); } }
@keyframes route-dashes { to { stroke-dashoffset: -104; } }
@media (prefers-reduced-motion: reduce) { .travelling-parcel, .journey-plane, .journey-dashes { animation: none; } .travelling-parcel { left: 27%; top: 30px; } .journey-heading button { display: none; } }
</style>
