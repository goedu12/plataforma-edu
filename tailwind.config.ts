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
        // PLATAFORMA EDU - DESIGN SYSTEM 2026
        // Glassmorphism + Soft UI + Micro-animations
        // Paleta: Verde, Branco, Laranja, Preto, Lilás
        // ═══════════════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────────────
        // CORES BASE - Fundos e Superfícies
        // ─────────────────────────────────────────────────────────────
        dark: {
          bg: '#0a0a0a',              // Preto profundo - background principal
          surface: '#121212',          // Superfície de cards
          elevated: '#1a1a1a',         // Cards elevados
          glass: 'rgba(18, 18, 18, 0.7)', // Glassmorphism
        },

        // Aliases para compatibilidade
        'calm-bg': '#0a0a0a',
        'calm-surface': '#121212',
        'calm-elevated': '#1a1a1a',
        'calm-border': '#2a2a2a',

        // ─────────────────────────────────────────────────────────────
        // VERDE - Cor primária (Sucesso, CTAs, Destaques)
        // ─────────────────────────────────────────────────────────────
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',              // Verde principal
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          glow: 'rgba(16, 185, 129, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // LARANJA - Cor secundária (Alertas, Gamificação, Energia)
        // ─────────────────────────────────────────────────────────────
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',              // Laranja principal
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          glow: 'rgba(249, 115, 22, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // LILÁS - Matemática (Criatividade, Imaginação)
        // ─────────────────────────────────────────────────────────────
        lilas: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',              // Lilás principal
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // Física - Verde (já usando primary)
        fisica: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          glow: 'rgba(16, 185, 129, 0.4)',
        },

        // Matemática - Lilás
        matematica: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // TEXTO - Hierarquia em Dark Mode
        // ─────────────────────────────────────────────────────────────
        text: {
          primary: '#ffffff',          // Branco puro
          secondary: '#b0b0b0',        // Cinza claro
          tertiary: '#808080',         // Cinza médio
          muted: '#606060',            // Cinza escuro
          disabled: '#404040',
        },

        // ─────────────────────────────────────────────────────────────
        // BORDAS E CONTORNOS
        // ─────────────────────────────────────────────────────────────
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a',
          focus: '#4a4a4a',
          glass: 'rgba(255, 255, 255, 0.1)',
        },

        // ─────────────────────────────────────────────────────────────
        // ESTADOS
        // ─────────────────────────────────────────────────────────────
        success: '#10b981',
        error: '#ef4444',
        warning: '#f97316',
        info: '#3b82f6',

        // Accent alias
        accent: {
          green: '#10b981',
          orange: '#f97316',
        },
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFIA 2026 - Hierarquia clara
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading-xl': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body': ['0.875rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS 2026 - Soft UI + Glassmorphism
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        // Neumorphism Soft UI
        'soft-xs': '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'soft-sm': '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
        'soft-md': '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4)',
        'soft-lg': '0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.5)',
        'soft-xl': '0 24px 64px rgba(0, 0, 0, 0.7), 0 12px 24px rgba(0, 0, 0, 0.6)',

        // Glow Effects
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2), 0 0 60px rgba(16, 185, 129, 0.1)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3), 0 0 40px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.1)',
        'glow-lilas': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.2), 0 0 60px rgba(168, 85, 247, 0.1)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',

        // Inner shadows (Neumorphism)
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',

        // Glassmorphism
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',

        // Cards elevated
        'card': '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },

      // ─────────────────────────────────────────────────────────────
      // ANIMAÇÕES 2026 - Micro-interactions
      // ─────────────────────────────────────────────────────────────
      animation: {
        // Entrada
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',

        // Contínuas
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',

        // Feedback
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'success-pop': 'successPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',

        // Skeleton loading
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        successPop: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },

      // ─────────────────────────────────────────────────────────────
      // BLUR E BACKDROP (Glassmorphism)
      // ─────────────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ─────────────────────────────────────────────────────────────
      // BORDER RADIUS 2026 - Mais arredondado
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '10px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // ─────────────────────────────────────────────────────────────
      // TRANSIÇÕES
      // ─────────────────────────────────────────────────────────────
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}

export default config
