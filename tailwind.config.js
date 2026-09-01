/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact Brand Palette
        brand: {
          50: '#f5f3ff',   // Luxury Light Canvas Background
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6d28d9',  // Primary Brand Purple (#6D28D9)
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
          950: '#2e1065',
        },
        navy: {
          800: '#1e1b4b',  // Dark Deep Navy (#1E1B4B)
          900: '#151336',
          950: '#0c0a24',
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // Electric Accent Cyan (#06B6D4)
          600: '#0891b2',
        },
        canvas: '#F5F3FF',
        ink: '#171717',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(109, 40, 217, 0.08)',
        'glass-hover': '0 16px 40px 0 rgba(109, 40, 217, 0.16)',
        'luxury': '0 20px 50px -12px rgba(30, 27, 75, 0.08), 0 0 0 1px rgba(221, 214, 254, 0.6)',
        'luxury-hover': '0 25px 60px -15px rgba(109, 40, 217, 0.22), 0 0 0 1px rgba(109, 40, 217, 0.4)',
        'glow-purple': '0 0 35px -5px rgba(109, 40, 217, 0.45)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.55)',
        'pill': '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
      },
      borderRadius: {
        'organic-1': '60% 40% 70% 30% / 40% 50% 60% 50%',
        'organic-2': '40% 60% 50% 70% / 60% 30% 70% 40%',
        'pill': '9999px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'blob': 'blob 10s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1.5deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(6, 182, 212, 0.7)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 70% 30% / 40% 50% 60% 50%' },
          '50%': { borderRadius: '40% 60% 50% 70% / 60% 40% 60% 40%' },
        }
      }
    },
  },
  plugins: [],
}
