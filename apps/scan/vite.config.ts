import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 5174,
    // Allows the ngrok tunnel's Host header (and LAN access) through Vite's
    // dev-server host check, which otherwise rejects unrecognized hosts.
    allowedHosts: true,
    proxy: {
      // Same-origin proxy so a single tunnel to this dev server also covers
      // API + WebSocket traffic — the phone never talks to localhost:3002 directly.
      '/api': { target: 'http://localhost:3002', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3002', ws: true, changeOrigin: true },
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'GSG Scan',
        short_name: 'GSG Scan',
        description: 'Application de scan pour les agents GSGLOGISTIQUE',
        theme_color: '#091f27',
        background_color: '#091f27',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-shell caching only — parcel data is always fetched fresh,
        // scanning stale data would be dangerous.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [],
      },
    }),
  ],
})
