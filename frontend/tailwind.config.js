/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00f0ff',
        'cyber-purple': '#8b5cf6',
        'cyber-pink': '#ec4899',
        'dark-bg': '#0f172a',
        'dark-surface': '#1e293b',
        'dark-elevated': '#334155',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 211, 238, 0.6)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 60px rgba(168, 85, 247, 0.7)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(34, 211, 238, 0.4)',
        'glow-lg': '0 0 40px rgba(34, 211, 238, 0.6)',
        'purple-glow': '0 0 30px rgba(168, 85, 247, 0.5)',
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
      }
    },
  },
  plugins: [],
}