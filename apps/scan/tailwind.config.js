/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0369a1',
          600: '#075985',
          700: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
