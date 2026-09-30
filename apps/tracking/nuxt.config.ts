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
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:3002/api',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL ?? 'http://localhost:3002',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'theme-color', content: '#fcf8f6' },
        { name: 'description', content: 'GSGLOGISTIQUE — Transport de colis entre les États-Unis et l\'Afrique de l\'Ouest. Suivez votre envoi en temps réel.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'GSG Tracking',
      short_name: 'GSG Track',
      description: 'Suivez votre colis GSGLOGISTIQUE',
      theme_color: '#fcf8f6',
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
    // Dev-only: lets a single tunnel to this app also reach the API/WS —
    // the phone never needs to talk to localhost:3000 directly.
    devProxy: {
      '/api': { target: 'http://localhost:3002/api', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3002/socket.io', ws: true, changeOrigin: true },
    },
  },

  typescript: { strict: true },

  // Allows the ngrok tunnel's Host header through Nuxt's underlying Vite
  // dev-server host check (otherwise it rejects unrecognized hosts).
  vite: {
    server: { allowedHosts: true },
  },
})
