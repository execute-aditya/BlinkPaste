/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08080E',
        'accent-primary': '#E8FF47',
        'accent-secondary': '#4FFFB0',
        'error-red': '#FF4F6A',
        'text-primary': '#EEEDF5',
        'text-muted': '#6B6A7A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        shake: 'shake 400ms ease-in-out',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'modal-in': 'modal-in 200ms ease-out',
        'sync-flash': 'sync-flash 800ms ease-out forwards',
        'timer-warning': 'timer-warning 1.5s ease-in-out infinite',
        'copy-flash': 'copy-flash 200ms ease-out',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-8px)' },
          '30%': { transform: 'translateX(8px)' },
          '45%': { transform: 'translateX(-5px)' },
          '60%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-3px)' },
          '90%': { transform: 'translateX(3px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            borderColor: 'rgba(232,255,71,0.2)',
            boxShadow: '0 0 0 0 rgba(232,255,71,0)',
          },
          '50%': {
            borderColor: 'rgba(232,255,71,0.7)',
            boxShadow:
              '0 0 20px 4px rgba(232,255,71,0.15), 0 0 40px 8px rgba(232,255,71,0.06)',
          },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'sync-flash': {
          '0%': {
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(79,255,176,0.7)',
            backgroundColor: '#4FFFB0',
          },
          '70%': {
            opacity: '1',
            boxShadow: '0 0 0 8px rgba(79,255,176,0)',
            backgroundColor: '#4FFFB0',
          },
          '100%': {
            opacity: '0.2',
            boxShadow: '0 0 0 0 rgba(79,255,176,0)',
            backgroundColor: '#4FFFB0',
          },
        },
        'timer-warning': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'copy-flash': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
