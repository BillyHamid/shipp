<script setup lang="ts">
// SMIL (<animateMotion>) isn't controllable via CSS, so the reduced-motion
// check happens here in JS — the plane element simply isn't rendered when
// the user has asked the OS for less motion.
const reduceMotion = ref(true)
onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})
</script>

<template>
  <div class="absolute inset-0" aria-hidden="true">
    <svg viewBox="0 0 800 500" class="w-full h-full opacity-[0.18]" preserveAspectRatio="xMidYMid slice">
      <path
        id="hero-route"
        d="M 80 380 Q 400 100 720 200"
        stroke="white"
        stroke-width="2"
        fill="none"
        stroke-dasharray="6 10"
        class="route-line"
      />
      <circle cx="80" cy="380" r="6" fill="white" />
      <circle cx="720" cy="200" r="6" fill="#fbbf24" />

      <g v-if="!reduceMotion">
        <path d="M -10 -4 L 10 0 L -10 4 L -6 0 Z" fill="#fbbf24" />
        <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
          <mpath href="#hero-route" />
        </animateMotion>
      </g>
    </svg>

    <div class="hero-blob hero-blob-1 absolute size-[26rem] rounded-full bg-accent-500/20 blur-3xl" />
    <div class="hero-blob hero-blob-2 absolute size-72 rounded-full bg-emerald-500/10 blur-3xl" />
  </div>
</template>

<style scoped>
.route-line {
  animation: dash-flow 3s linear infinite;
}
.hero-blob-1 {
  top: -6rem;
  right: -6rem;
  animation: drift-a 14s ease-in-out infinite;
}
.hero-blob-2 {
  bottom: -4rem;
  left: 10%;
  animation: drift-b 18s ease-in-out infinite;
}

@keyframes dash-flow {
  to { stroke-dashoffset: -160; }
}
@keyframes drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-2rem, 1.5rem) scale(1.08); }
}
@keyframes drift-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(1.5rem, -1rem) scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .route-line,
  .hero-blob-1,
  .hero-blob-2 {
    animation: none;
  }
}
</style>
