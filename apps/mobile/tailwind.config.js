/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        fnf: {
          bg: '#0D0D14',
          surface: '#13121F',
          purple: '#8B2BFF',
          violet: '#C84BFF',
          pink: '#FF6BAA',
          green: '#00FFA0',
          text: '#F0EEFF',
          muted: '#6B5A8A',
          secondary: '#D0C8E8',
        },
      },
      fontFamily: {
        heading: ['Syne'],
        body: ['DMSans'],
      },
    },
  },
  plugins: [],
};
