import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#F4F1EA',
        'paper-2': '#EBE7DD',
        ash: '#6B6660',
        accent: '#E2462E',
        rule: 'rgba(10, 10, 10, 0.12)',
      },
      fontFamily: {
        sans: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        display: '-0.02em',
        hud: '0.08em',
      },
      borderRadius: {
        none: '0',
      },
      maxWidth: {
        prose: '60ch',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      animation: {
        'tick-in': 'tickIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'draw-line': 'drawLine 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'register': 'register 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'orbit-slow': 'orbit 80s linear infinite',
        'accent-pulse': 'accentPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        tickIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        register: {
          '0%': { opacity: '0', transform: 'translate(-4px, -4px)' },
          '100%': { opacity: '1', transform: 'translate(0, 0)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        accentPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-dots':
          'radial-gradient(rgba(10,10,10,0.10) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
    },
  },
  plugins: [],
}

export default config
