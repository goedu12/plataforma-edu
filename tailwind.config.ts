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
        // ═══════════════════════════════════════════════════════════
        // KOYEB-INSPIRED DARK THEME - Plataforma Educacional
        // ═══════════════════════════════════════════════════════════

        // Backgrounds - Dark Premium
        dark: {
          bg: '#0a0a0a',              // Background principal
          surface: '#141414',          // Cards e containers
          elevated: '#1a1a1a',         // Cards hover/elevados
          terminal: '#1e1e1e',         // Corpo do terminal
          header: '#2d2d2d',           // Header do terminal
        },

        // Bordas
        border: {
          DEFAULT: '#222222',          // Borda padrão
          hover: '#333333',            // Borda hover
          subtle: 'rgba(255,255,255,0.08)',
        },

        // Texto - Hierarquia clara em dark mode
        text: {
          primary: '#ffffff',          // Texto principal
          secondary: '#888888',        // Descrições (~55%)
          tertiary: '#666666',         // Labels (~40%)
          disabled: '#444444',         // Desabilitado (~25%)
          comment: '#6b7280',          // Comentários terminal
        },

        // Física - Cyan/Teal Tech
        fisica: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',              // Cor principal - cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          glow: 'rgba(6, 182, 212, 0.15)',
        },

        // Matemática - Purple/Violet Tech
        matematica: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',              // Cor principal - purple
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          glow: 'rgba(168, 85, 247, 0.15)',
        },

        // Accent - Verde Koyeb (para sucesso/CTAs)
        accent: {
          green: '#10b981',            // Verde Koyeb principal
          'green-light': '#34d399',    // Verde hover
          'green-glow': 'rgba(16, 185, 129, 0.15)',
        },

        // Estados
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',

        // Terminal dots
        terminal: {
          red: '#ff5f56',
          yellow: '#ffbd2e',
          green: '#27ca3f',
        },

        // Grid pattern
        grid: 'rgba(255,255,255,0.03)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Hierarquia tipográfica Koyeb-style
        'hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '700' }],
        'display': ['2.5rem', { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '700' }],
        'heading': ['1.5rem', { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '700' }],
        'subheading': ['1.125rem', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.05em', fontWeight: '500' }],
        'micro': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '500' }],
        'code': ['0.8125rem', { lineHeight: '1.6', fontWeight: '400' }],
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
      },

      boxShadow: {
        'none': 'none',
        'glow-green': '0 0 30px rgba(16, 185, 129, 0.15)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.15)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.4)',
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
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },

      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}

export default config
