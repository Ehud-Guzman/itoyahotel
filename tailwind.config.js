/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#a4733c',
        'primary-dark': '#8c5f2e',
        gold: '#C7A56B',
        'gold-light': '#d4b882',
        'gold-dark': '#a8863a',
        cream: '#FAFAF8',
        mist: '#F4F2EE',
        stone: '#E8E4DC',
        ink: '#1E1E1E',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
