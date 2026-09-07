/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict White & Vibrant Orange Brand Palette
        brand: {
          50: '#FFF7ED',   // Soft Orange Canvas & Hero Tint (#FFF7ED)
          100: '#FFEDD5',
          200: '#FED7AA',  // Subtle Warm Orange Border
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // Primary Vibrant Orange (#F97316)
          600: '#EA580C',  // Orange Active / Hover
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        charcoal: {
          800: '#1F2937',  // Dark Charcoal Typography & Structure (#1F2937)
          900: '#111827',
          950: '#030712',
        },
        navy: {
          800: '#1F2937',  // Cleanly mapped to Dark Charcoal
          900: '#111827',
          950: '#030712',
        },
        cyan: {
          300: '#FED7AA',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        },
        canvas: '#FFFFFF',
        ink: '#1F2937',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(249, 115, 22, 0.06)',
        'glass-hover': '0 16px 40px 0 rgba(249, 115, 22, 0.12)',
        'luxury': '0 20px 50px -12px rgba(31, 41, 55, 0.06), 0 0 0 1px rgba(254, 215, 170, 0.5)',
        'luxury-hover': '0 25px 60px -15px rgba(249, 115, 22, 0.18), 0 0 0 1px rgba(249, 115, 22, 0.3)',
        'glow-orange': '0 0 35px -5px rgba(249, 115, 22, 0.45)',
        'glow-purple': '0 0 35px -5px rgba(249, 115, 22, 0.45)',
        'glow-cyan': '0 0 30px -5px rgba(249, 115, 22, 0.55)',
        'pill': '0 10px 30px -5px rgba(31, 41, 55, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
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
