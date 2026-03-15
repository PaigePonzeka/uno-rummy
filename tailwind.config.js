/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        uno: {
          red:    '#D72600',
          blue:   '#0956BF',
          green:  '#379711',
          yellow: '#C9A800',
          purple: '#9333EA',
        },
        felt: {
          DEFAULT: '#0e0404',
          dark:    '#080202',
        },
      },
      fontFamily: {
        game: ['Arial Black', 'Arial', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':       { transform: 'translateX(-10px)' },
          '40%':       { transform: 'translateX(10px)' },
          '60%':       { transform: 'translateX(-6px)' },
          '80%':       { transform: 'translateX(6px)' },
        },
        'uno-flash': {
          '0%, 100%': { opacity: '0' },
          '50%':      { opacity: '1' },
        },
        thinking: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
      },
      animation: {
        shake:    'shake 0.5s ease-in-out',
        'uno-flash': 'uno-flash 0.3s ease-in-out',
        thinking: 'thinking 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
