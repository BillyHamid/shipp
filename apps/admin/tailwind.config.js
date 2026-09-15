/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          400: '#fb7185',
          500: '#e5484d',
          600: '#c62832',
          700: '#a61d29',
          900: '#65101a',
        },
        // Deep-navy neutral — the sidebar/surface identity, shared with the
        // public Tracking site so the two apps read as one product family.
        ink: {
          50: '#faf7f7',
          100: '#f1e9e9',
          200: '#e3d4d5',
          300: '#cbb9bb',
          500: '#806e71',
          700: '#493a3c',
          800: '#32282a',
          900: '#251d1f',
          950: '#170f11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
