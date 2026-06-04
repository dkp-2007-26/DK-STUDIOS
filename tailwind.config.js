/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf9e7',
          100: '#faf0c0',
          200: '#f5e090',
          300: '#edc855',
          400: '#e3b030',
          500: '#D4AF37',
          600: '#C9A03C',
          700: '#a07c28',
          800: '#7d5e1e',
          900: '#5c4316',
        },
        dark: {
          50: '#2a2a2a',
          100: '#222222',
          200: '#1a1a1a',
          300: '#141414',
          400: '#0e0e0e',
          500: '#0a0a0a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 24px 10px rgba(212,175,55,0.15)' },
        },
      },
      boxShadow: {
        gold: '0 0 20px rgba(212,175,55,0.25)',
        'gold-lg': '0 0 50px rgba(212,175,55,0.3)',
        card: '0 4px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
