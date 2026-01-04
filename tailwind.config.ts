import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // KOYEB DESIGN SYSTEM - PLATAFORMA EDU 2026
        // Briefing UI/UX Completo
        // ═══════════════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────────────
        // DARK THEME BACKGROUNDS (Briefing)
        // ─────────────────────────────────────────────────────────────
        dark: {
          base: '#0a0a0a',           // Fundo principal
          elevated: '#0d0d0d',        // Sidebar, áreas elevadas
          surface: '#141414',         // Cards, containers
          'surface-hover': '#1a1a1a', // Cards em hover
          overlay: '#1e1e1e',         // Modals, dropdowns
        },

        // Terminal colors
        terminal: {
          bg: '#1e1e1e',              // Corpo do terminal
          header: '#2d2d2d',          // Header do terminal
          'dot-close': '#ff5f56',
          'dot-minimize': '#ffbd2e',
          'dot-maximize': '#27ca3f',
        },

        // ─────────────────────────────────────────────────────────────
        // PRIMARY - Verde Emerald (Briefing: #10b981)
        // ─────────────────────────────────────────────────────────────
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',             // Hover state
          500: '#10b981',             // PRIMARY (Briefing)
          600: '#059669',             // Pressed state
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // FÍSICA - Alias de Primary
        // ─────────────────────────────────────────────────────────────
        fisica: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // MATEMÁTICA - Roxo (#a855f7)
        // ─────────────────────────────────────────────────────────────
        matematica: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',             // Hover state
          500: '#a855f7',             // PRIMARY MATEMATICA
          600: '#9333ea',             // Pressed state
          700: '#7c3aed',
          DEFAULT: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // Alias lilas = matematica
        lilas: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          DEFAULT: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // ACCENT - Cyan (#06b6d4)
        // ─────────────────────────────────────────────────────────────
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',             // ACCENT (Briefing)
          600: '#0891b2',
          700: '#0e7490',
          DEFAULT: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // SECONDARY - Laranja (#f59e0b / warning)
        // ─────────────────────────────────────────────────────────────
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // TEXTO - Hierarquia (Briefing)
        // ─────────────────────────────────────────────────────────────
        text: {
          primary: '#ffffff',         // Títulos, headings
          secondary: '#a1a1aa',       // Parágrafos, descrições (~65%)
          tertiary: '#71717a',        // Labels, metadados (~45%)
          muted: '#52525b',           // Placeholders, desabilitado (~32%)
        },

        // ─────────────────────────────────────────────────────────────
        // BORDAS (Briefing)
        // ─────────────────────────────────────────────────────────────
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.15)',
          fisica: 'rgba(16, 185, 129, 0.3)',
          matematica: 'rgba(168, 85, 247, 0.3)',
        },

        // ─────────────────────────────────────────────────────────────
        // ESTADOS (Briefing)
        // ─────────────────────────────────────────────────────────────
        success: {
          500: '#10b981',
          DEFAULT: '#10b981',
        },
        error: {
          500: '#ef4444',
          DEFAULT: '#ef4444',
        },
        warning: {
          500: '#f59e0b',
          DEFAULT: '#f59e0b',
        },
        info: {
          500: '#3b82f6',
          DEFAULT: '#3b82f6',
        },

        // ─────────────────────────────────────────────────────────────
        // Compatibilidade com código existente
        // ─────────────────────────────────────────────────────────────
        koyeb: {
          bg: '#0a0a0a',
          card: '#141414',
          elevated: '#1a1a1a',
          terminal: '#1e1e1e',
          dark: '#0d0d0d',
        },
        'calm-bg': '#0a0a0a',
        'calm-surface': '#141414',
        'calm-elevated': '#1a1a1a',
        'calm-border': 'rgba(255, 255, 255, 0.08)',
        dot: {
          red: '#ff5f56',
          yellow: '#ffbd2e',
          green: '#27ca3f',
        },
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFIA (Briefing)
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Space Grotesk', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        // Hero/Display
        'hero': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],

        // Headings
        'title': ['1.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.01em' }],
        'heading': ['1.125rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.01em' }],
        'subheading': ['1rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.02em' }],

        // Body
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],

        // Caption/Label
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
        'label': ['0.6875rem', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0.05em' }],
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS (Briefing)
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.3)',

        // Glow effects (Briefing)
        'glow-green': '0 0 30px rgba(16, 185, 129, 0.15)',
        'glow-lilas': '0 0 30px rgba(168, 85, 247, 0.15)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.15)',
        'glow-amber': '0 0 30px rgba(245, 158, 11, 0.15)',

        // Card
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.6)',

        // Glass
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },

      // ─────────────────────────────────────────────────────────────
      // ANIMAÇÕES (Briefing)
      // ─────────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-once': 'bounceOnce 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        skeleton: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },

      // ─────────────────────────────────────────────────────────────
      // OUTROS (Briefing)
      // ─────────────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },

      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },

      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
    },
  },
  plugins: [],
}

export default config
