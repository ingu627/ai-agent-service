/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'notion-gray': {
          50: '#f7f6f3',
          100: '#ededea',
          200: '#e0dfdb',
          300: '#cecdc7',
          400: '#b7b5ad',
          500: '#a4a29a',
          600: '#8e8c84',
          700: '#757269',
          800: '#5f5d56',
          900: '#4f4e47',
        },
      },
      animation: {
        'pulse-dot': 'pulse 1.4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

