/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from your design system
        primary: {
          DEFAULT: '#2962FF',
          50: '#F0F4FF',
          100: '#E0EAFF',
          200: '#C7D8FF',
          300: '#A4C0FF',
          400: '#7F9FFF',
          500: '#2962FF',
          600: '#2052E0',
          700: '#1B43C7',
          800: '#1637A6',
          900: '#132D85',
        },
        accent: {
          DEFAULT: '#FFCA28',
          50: '#FFF9E1',
          100: '#FFF3C4',
          200: '#FFEB8A',
          300: '#FFE350',
          400: '#FFDB16',
          500: '#FFCA28',
          600: '#E6B020',
          700: '#CC9518',
          800: '#B37A10',
          900: '#996008',
        },
        success: {
          DEFAULT: '#43A047',
          50: '#F1F8E9',
          100: '#DCEDC8',
          200: '#C5E1A5',
          300: '#AED581',
          400: '#9CCC65',
          500: '#43A047',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#104E22',
        },
        danger: {
          DEFAULT: '#E53935',
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#E53935',
          600: '#D32F2F',
          700: '#C62828',
          800: '#B71C1C',
          900: '#8B1538',
        },
        background: '#F4F6FB',
        surface: '#FFFFFF',
        border: '#E0E5ED',
        'text-primary': '#1A2233',
        'text-secondary': '#707A94',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}