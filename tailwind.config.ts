import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // PLATAFORMA EDU - DESIGN SYSTEM 4.0
        // Briefing Completo - Janeiro 2026
        // ═══════════════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────────────
        // DARK THEME BACKGROUNDS
        // ─────────────────────────────────────────────────────────────
        dark: {
          base: '#0a0a0a',           // Fundo principal
          elevated: '#111111',        // Sidebar, areas elevadas
          surface: '#171717',         // Cards, containers
          'surface-hover': '#1f1f1f', // Cards em hover
          overlay: '#262626',         // Modals, dropdowns
        },

        // ─────────────────────────────────────────────────────────────
        // LIGHT THEME BACKGROUNDS
        // ─────────────────────────────────────────────────────────────
        light: {
          base: '#ffffff',
          elevated: '#f5f5f5',
          surface: '#fafafa',
          'surface-hover': '#f0f0f0',
          overlay: '#e5e5e5',
        },

        // ─────────────────────────────────────────────────────────────
        // FISICA - Verde Vibrante (#22c55e)
        // ─────────────────────────────────────────────────────────────
        fisica: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',             // PRIMARY FISICA
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          DEFAULT: '#22c55e',
          glow: 'rgba(34, 197, 94, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // MATEMATICA - Roxo Vibrante (#8b5cf6)
        // ─────────────────────────────────────────────────────────────
        matematica: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',             // PRIMARY MATEMATICA
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#8b5cf6',
          glow: 'rgba(139, 92, 246, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // ACCENT - Sky Blue (#0ea5e9)
        // ─────────────────────────────────────────────────────────────
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',             // ACCENT
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // STREAK - Laranja (#f97316)
        // ─────────────────────────────────────────────────────────────
        streak: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',             // STREAK/WARNING
          600: '#ea580c',
          700: '#c2410c',
          DEFAULT: '#f97316',
          glow: 'rgba(249, 115, 22, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // ESTADOS
        // ─────────────────────────────────────────────────────────────
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          DEFAULT: '#10b981',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          DEFAULT: '#ef4444',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          DEFAULT: '#f59e0b',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          DEFAULT: '#3b82f6',
        },

        // ─────────────────────────────────────────────────────────────
        // TEXTO - Dark Mode
        // ─────────────────────────────────────────────────────────────
        'text-dark': {
          primary: '#ffffff',
          secondary: '#a1a1aa',
          tertiary: '#71717a',
          muted: '#52525b',
        },

        // ─────────────────────────────────────────────────────────────
        // TEXTO - Light Mode
        // ─────────────────────────────────────────────────────────────
        'text-light': {
          primary: '#171717',
          secondary: '#525252',
          tertiary: '#737373',
          muted: '#a3a3a3',
        },

        // ─────────────────────────────────────────────────────────────
        // BORDAS
        // ─────────────────────────────────────────────────────────────
        border: {
          dark: 'rgba(255, 255, 255, 0.1)',
          'dark-hover': 'rgba(255, 255, 255, 0.2)',
          light: 'rgba(0, 0, 0, 0.1)',
          'light-hover': 'rgba(0, 0, 0, 0.2)',
          fisica: 'rgba(34, 197, 94, 0.3)',
          matematica: 'rgba(139, 92, 246, 0.3)',
        },

        // ─────────────────────────────────────────────────────────────
        // ALIASES - Compatibilidade
        // ─────────────────────────────────────────────────────────────
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          DEFAULT: '#22c55e',
        },
        lilas: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          DEFAULT: '#8b5cf6',
        },
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFIA (Briefing 4.0)
      // Nunito para display, Inter para body, JetBrains Mono para code
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Nunito', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        // Hero/Display - NO UPPERCASE (Title Case)
        'hero': ['2.5rem', { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],

        // Headings - NO UPPERCASE (Title Case)
        'title': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
        'heading': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],

        // Body
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body': ['0.9375rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],

        // Caption/Label - labels podem ser uppercase
        'caption': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['0.75rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.02em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.04em' }],
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.25)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.25)',

        // Glow effects
        'glow-fisica': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-matematica': '0 0 20px rgba(139, 92, 246, 0.25)',
        'glow-accent': '0 0 20px rgba(14, 165, 233, 0.25)',
        'glow-streak': '0 0 20px rgba(249, 115, 22, 0.25)',

        // Card shadows
        'card': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'card-light': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'card-light-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',

        // Bottom nav
        'nav': '0 -4px 20px rgba(0, 0, 0, 0.4)',
        'nav-light': '0 -4px 20px rgba(0, 0, 0, 0.1)',
      },

      // ─────────────────────────────────────────────────────────────
      // ANIMACOES
      // ─────────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'streak-glow': 'streakGlow 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        streakGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(249, 115, 22, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(249, 115, 22, 0.6)' },
        },
      },

      // ─────────────────────────────────────────────────────────────
      // BREAKPOINTS (Briefing 4.0)
      // ─────────────────────────────────────────────────────────────
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',      // Tablet
        'lg': '1024px',     // Laptop
        'xl': '1280px',     // Desktop
        '2xl': '1536px',
      },

      // ─────────────────────────────────────────────────────────────
      // OUTROS
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
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
        'nav': '64px',          // Bottom nav height
        'nav-rail': '72px',     // Navigation rail width
        'nav-rail-expanded': '256px',
      },

      minHeight: {
        'touch': '48px',        // Touch target minimum (48dp)
        'nav': '64px',
      },

      minWidth: {
        'touch': '48px',
      },

      zIndex: {
        'nav': '50',
        'modal': '100',
        'toast': '150',
      },
    },
  },
  plugins: [],
}

export default config
