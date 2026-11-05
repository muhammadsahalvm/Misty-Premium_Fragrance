/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F3ED',
        beige: '#E8DED0',
        charcoal: '#272522',
        champagne: '#B69A78',
        'champagne-soft': '#D7C5AE',
      },
      fontFamily: {
        editorial: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.18em',
      },
    },
  },
  plugins: [],
}
