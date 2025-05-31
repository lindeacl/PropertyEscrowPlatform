/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors from design system - Royal Blue Primary
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
        // Sun Gold Accent
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
        // Emerald Green Success
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
        // Confident Red Error/Alert
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
        // Background & Surface - Light Mode
        background: {
          DEFAULT: '#F4F6FB', // Soft Grey
          dark: '#0F1419', // Dark mode background
        },
        surface: {
          DEFAULT: '#FFFFFF', // White cards/surfaces
          dark: '#1A2233', // Dark mode surface
        },
        // Border & Disabled
        border: {
          DEFAULT: '#E0E5ED', // Light Slate
          dark: '#2A3441',
        },
        // Text Colors
        text: {
          primary: {
            DEFAULT: '#1A2233', // Almost Black
            dark: '#F4F6FB',
          },
          secondary: {
            DEFAULT: '#707A94', // Charcoal Grey
            dark: '#9CA3AF',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'ui-sans-serif', 'system-ui'],
        mono: ['Fira Mono', 'ui-monospace', 'monospace'], // For blockchain addresses/amounts
      },
      fontSize: {
        'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0 2px 16px rgba(41, 98, 255, 0.07)',
        'card-hover': '0 4px 24px rgba(41, 98, 255, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scale-hover': 'scaleHover 0.2s ease-out',
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
        scaleHover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}