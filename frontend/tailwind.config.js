/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hearsay brand colors from logo
        'hearsay-cyan': '#52C6DB',
        'hearsay-blue': '#7DB8E8',
        'hearsay-purple': '#A78BE8',
        'hearsay-light': '#B8D4F1',
      },
      backgroundImage: {
        'hearsay-gradient': 'linear-gradient(135deg, #52C6DB 0%, #7DB8E8 50%, #A78BE8 100%)',
      }
    },
  },
  plugins: [],
}

