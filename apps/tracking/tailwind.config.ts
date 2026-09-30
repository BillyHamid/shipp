import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0369a1',
          600: '#075985',
          700: '#0c4a6e',
        },
        // Deep-navy identity for the showcase site — hero backgrounds and
        // headings — distinct from the neutral slate used for body chrome.
        ink: {
          50: '#f7f7f2',
          100: '#ede1e2',
          300: '#a8c0c5',
          500: '#73666a',
          700: '#514047',
          800: '#193a43',
          900: '#30282a',
          950: '#091f27',
        },
        // Warm accent for CTAs and "in motion" states — the energy color
        // against the navy, same role amber/orange plays for DHL/FedEx.
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e5484d',
          600: '#c62832',
          700: '#a61d29',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
