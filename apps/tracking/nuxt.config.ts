export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },

  modules: ['@nuxt/icon', '@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL ?? 'http://localhost:3000',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'theme-color', content: '#0369a1' },
        { name: 'description', content: 'Suivez votre colis GSGLOGISTIQUE en temps réel' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'GSG Tracking',
      short_name: 'GSG Track',
      description: 'Suivez votre colis GSGLOGISTIQUE',
      theme_color: '#0369a1',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: null, // SSR handles navigation; PWA is for asset caching only
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  typescript: { strict: true },
})
