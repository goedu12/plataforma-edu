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
        // Terminal-style dark theme with vibrant accents
        // ═══════════════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────────────
        // KOYEB BACKGROUNDS - Gradiente escuro
        // ─────────────────────────────────────────────────────────────
        koyeb: {
          bg: '#0D0D14',              // Background mais escuro
          card: '#1A1A2E',            // Cards e superfícies
          elevated: '#222238',         // Elementos elevados
          terminal: '#2D2D3A',         // Blocos de código/terminal
          dark: '#12121C',             // Progress bar bg
        },

        // Aliases para dark theme (compatibilidade)
        dark: {
          bg: '#0D0D14',
          surface: '#1A1A2E',
          elevated: '#222238',
          glass: 'rgba(26, 26, 46, 0.8)',
        },

        // ─────────────────────────────────────────────────────────────
        // KOYEB PRIMARY - Verde vibrante (#00FF88)
        // ─────────────────────────────────────────────────────────────
        primary: {
          50: '#e6fff5',
          100: '#b3ffe0',
          200: '#80ffcc',
          300: '#4dffb8',
          400: '#1affa3',
          500: '#00FF88',              // KOYEB PRIMARY
          600: '#00CC6A',
          700: '#00994F',
          800: '#006635',
          900: '#00331A',
          DEFAULT: '#00FF88',
          glow: 'rgba(0, 255, 136, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // KOYEB ACCENT - Cyan (#00D4FF)
        // ─────────────────────────────────────────────────────────────
        accent: {
          50: '#e6faff',
          100: '#b3f0ff',
          200: '#80e6ff',
          300: '#4ddcff',
          400: '#1ad2ff',
          500: '#00D4FF',              // KOYEB ACCENT
          600: '#00A8CC',
          700: '#007C99',
          800: '#005066',
          900: '#002433',
          DEFAULT: '#00D4FF',
          glow: 'rgba(0, 212, 255, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // FÍSICA - Verde Koyeb (alias de primary)
        // ─────────────────────────────────────────────────────────────
        fisica: {
          50: '#e6fff5',
          100: '#b3ffe0',
          200: '#80ffcc',
          300: '#4dffb8',
          400: '#1affa3',
          500: '#00FF88',
          600: '#00CC6A',
          700: '#00994F',
          DEFAULT: '#00FF88',
          glow: 'rgba(0, 255, 136, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // MATEMÁTICA - Roxo (#A855F7)
        // ─────────────────────────────────────────────────────────────
        matematica: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#A855F7',
          600: '#9333ea',
          700: '#7c3aed',
          DEFAULT: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // Alias lilas = matematica
        lilas: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#A855F7',
          600: '#9333ea',
          700: '#7c3aed',
          DEFAULT: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // SECUNDÁRIA - Laranja (#FF6B35)
        // ─────────────────────────────────────────────────────────────
        secondary: {
          50: '#fff5f0',
          100: '#ffe6db',
          200: '#ffc9b3',
          300: '#ffab8a',
          400: '#ff8862',
          500: '#FF6B35',
          600: '#CC562A',
          700: '#994020',
          DEFAULT: '#FF6B35',
          glow: 'rgba(255, 107, 53, 0.4)',
        },

        // ─────────────────────────────────────────────────────────────
        // TEXTO - Hierarquia Koyeb (Briefing Atualizado)
        // ─────────────────────────────────────────────────────────────
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0B0',  // Atualizado conforme briefing
          tertiary: '#5A5A6E',
          muted: '#3D3D4A',
          disabled: '#2D2D3A',
          inverse: '#0D0D14',   // Novo: texto em fundos claros
        },

        // ─────────────────────────────────────────────────────────────
        // BORDAS - Koyeb style
        // ─────────────────────────────────────────────────────────────
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.1)',
          focus: 'rgba(0, 255, 136, 0.3)',
          glass: 'rgba(255, 255, 255, 0.1)',
        },

        // ─────────────────────────────────────────────────────────────
        // ESTADOS
        // ─────────────────────────────────────────────────────────────
        success: '#00FF88',
        error: '#FF4757',
        warning: '#FFB800',
        info: '#00D4FF',

        // ─────────────────────────────────────────────────────────────
        // TERMINAL DOTS (macOS style)
        // ─────────────────────────────────────────────────────────────
        dot: {
          red: '#FF5F56',
          yellow: '#FFBD2E',
          green: '#27CA40',
        },

        // Compatibilidade com código antigo
        'calm-bg': '#0D0D14',
        'calm-surface': '#1A1A2E',
        'calm-elevated': '#222238',
        'calm-border': 'rgba(255, 255, 255, 0.05)',
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFIA KOYEB - Space Mono + Inter
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Space Mono', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        // Display
        'display-xl': ['4rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],

        // Headings
        'heading-xl': ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],

        // Body
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],

        // Labels (Koyeb style - monospace uppercase)
        'label': ['0.6875rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.15em' }],
        'label-sm': ['0.625rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.15em' }],

        // Caption
        'caption': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS KOYEB - Glow effects
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        // Soft shadows
        'soft-xs': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'soft-sm': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'soft-md': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'soft-lg': '0 16px 48px rgba(0, 0, 0, 0.7)',

        // Glow effects - Koyeb style
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.15)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.15)',
        'glow-lilas': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.15)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.3), 0 0 40px rgba(255, 107, 53, 0.15)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',

        // Text shadow for nota grande
        'text-glow': '0 0 40px rgba(0, 255, 136, 0.3)',

        // Card shadows
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.6)',

        // Glass
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',

        // Inner
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
      },

      // ─────────────────────────────────────────────────────────────
      // GRADIENTES KOYEB
      // ─────────────────────────────────────────────────────────────
      backgroundImage: {
        'koyeb-gradient': 'linear-gradient(180deg, #0D0D14 0%, #1A1A2E 100%)',
        'koyeb-card': 'linear-gradient(135deg, #1A1A2E 0%, rgba(0, 255, 136, 0.05) 100%)',
        'progress-green': 'linear-gradient(90deg, #00FF88, #00D4FF)',
        'progress-lilas': 'linear-gradient(90deg, #A855F7, #00D4FF)',
      },

      // ─────────────────────────────────────────────────────────────
      // ANIMAÇÕES
      // ─────────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.4)' },
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
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
