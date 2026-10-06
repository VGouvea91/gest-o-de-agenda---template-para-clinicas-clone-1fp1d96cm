import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import aspectRatioPlugin from '@tailwindcss/aspect-ratio'

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          primary: {
            soft: '#e8e5f1',
            banner: '#dcd7ec',
          },
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        lavender: {
          50: '#f4f3f8',
          100: '#eae7f1',
          200: '#d7d2e6',
          300: '#bcb2d5',
          400: '#9d8ec0',
          500: '#8b7fb8',
          600: '#71609c',
          700: '#5f4f85',
          800: '#4e416d',
          900: '#413759',
          950: '#2a2438',
        },
        mint: {
          DEFAULT: '#87a596',
          900: '#2a4034',
          950: '#1b2a22',
        },
        warm: '#c9b896',
        blush: '#d4a5a5',
        deep: '#2a2438',
        subtle: '#6b6483',
        base: '#fafaf9',
        elevated: '#ffffff',
      },
      boxShadow: {
        'lavender-glow': '0 4px 14px 0 rgba(139, 127, 184, 0.39)',
        subtle: '0 1px 3px 0 rgba(42, 36, 56, 0.05), 0 1px 2px 0 rgba(42, 36, 56, 0.03)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'hero-bg-drift': {
          '0%, 100%': { backgroundPosition: 'center center' },
          '50%': { backgroundPosition: 'center 52%' },
        },
      },
      animation: {
        'hero-bg-drift': 'hero-bg-drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin, aspectRatioPlugin],
} satisfies Config
