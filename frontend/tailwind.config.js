/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F6F2',
        paper: '#F8F6F2',
        bone: '#EFEBE4',
        beige: '#EFEBE4',
        charcoal: '#14110F',
        ink: '#14110F',
        'secondary-ink': '#3B342E',
        oxblood: '#5A1E1E',
        brass: '#A88B5E',
        champagne: '#A88B5E',
        sage: '#8A9080',
        divider: '#D9D2C6',
        'champagne-soft': '#D7C5AE',
      },
      fontFamily: {
        editorial: ['Cormorant Garamond', 'Garamond', 'Times New Roman', 'serif'],
        sans: ['Hanken Grotesk', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.18em',
      },
    },
  },
  plugins: [],
}
