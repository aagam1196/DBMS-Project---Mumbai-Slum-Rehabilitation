/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        sra: {
          bg: '#0A0E1A',
          surface: '#111827',
          card: '#141D2E',
          border: '#1E2D45',
          accent: '#F97316',
          accent2: '#06B6D4',
          accent3: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          text: '#E2E8F0',
          muted: '#64748B',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(249,115,22,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(249,115,22,0.8)' },
        }
      }
    },
  },
  plugins: [],
}
