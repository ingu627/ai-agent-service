/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'notion-gray': {
          25: '#fcfcfc',
          50: '#f7f7f5',
          100: '#ebebea',
          200: '#ddddd9',
          300: '#c8c7c1',
          400: '#a8a29e',
          500: '#8b8680',
          600: '#6c6b66',
          700: '#52514e',
          800: '#3f3f3c',
          900: '#2d2d2a',
        },
        'primary': {
          50: '#f0f0ff',
          100: '#e5e7ff',
          500: '#6366f1',
          600: '#5855eb',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        },
        'accent': {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
        }
      },
      animation: {
        'pulse-dot': 'pulse 1.4s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'medium': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
        'large': '0 8px 32px 0 rgb(0 0 0 / 0.16)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
