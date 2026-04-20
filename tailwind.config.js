/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF6D9',
        mint: '#A8E6CF',
        babyblue: '#A2D2FF',
        sunset: '#FFAAA5',
        critical: '#FF6B6B',
        'text-primary': '#2F2A26',
        'text-secondary': '#6B5E57',
        'card-bg': '#FFFFFF',
      },
      fontFamily: {
        heading: ['Smiley Sans', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        body: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

