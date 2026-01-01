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
        // Dark Theme Premium - Hierarquia de superfícies
        dark: {
          bg: '#0A0A0F',        // Background principal
          surface: '#12121A',    // Cards nível 1
          elevated: '#1A1A24',   // Cards nível 2
          border: '#2A2A3A',     // Bordas sutis
          muted: '#3A3A4A',      // Elementos desabilitados
        },
        // Texto em dark mode
        light: {
          primary: '#FFFFFF',
          secondary: '#A0A0B0',
          muted: '#606070',
          accent: '#E0E0E8',
        },
        // Accent Colors - Vibrantes para dark mode
        accent: {
          orange: '#FF6B2C',
          coral: '#FF8A5B',
          gold: '#FFD93D',
        },
        // Física - Ciano Neon (mais vibrante para dark mode)
        fisica: {
          50: '#e0fcff',
          100: '#b8f8ff',
          200: '#7ef3ff',
          300: '#3cecff',
          400: '#00E5FF',    // Cor principal - Ciano neon
          500: '#00D4ED',
          600: '#00A8C2',
          700: '#007B8F',
          800: '#004D5C',
          900: '#002630',
          glow: 'rgba(0, 229, 255, 0.4)',
        },
        // Matemática - Magenta/Roxo Neon
        matematica: {
          50: '#fce4ff',
          100: '#f5b8ff',
          200: '#ee7eff',
          300: '#E040FB',    // Cor principal - Magenta neon
          400: '#D500F9',
          500: '#AA00FF',
          600: '#8E00CC',
          700: '#6A0099',
          800: '#460066',
          900: '#230033',
          glow: 'rgba(224, 64, 251, 0.4)',
        },
        // Success/Error/Warning vibrantes
        success: {
          DEFAULT: '#00E676',
          glow: 'rgba(0, 230, 118, 0.4)',
        },
        error: {
          DEFAULT: '#FF5252',
          glow: 'rgba(255, 82, 82, 0.4)',
        },
        warning: {
          DEFAULT: '#FFD740',
          glow: 'rgba(255, 215, 64, 0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'heading': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'micro': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      animation: {
        // Animações base
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',

        // Animações de partículas e fundo
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 3s',
        'drift': 'drift 20s linear infinite',
        'drift-reverse': 'drift 25s linear infinite reverse',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 30s linear infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',

        // Animações de UI
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'gradient': 'gradient 8s ease infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',

        // Micro-interações
        'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shake': 'shake 0.4s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(2deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -20px) rotate(90deg)' },
          '50%': { transform: 'translate(-5px, -40px) rotate(180deg)' },
          '75%': { transform: 'translate(-15px, -20px) rotate(270deg)' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      boxShadow: {
        // Sombras para dark mode
        'dark': '0 4px 20px 0 rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 40px 0 rgba(0, 0, 0, 0.6)',
        'dark-hover': '0 20px 60px 0 rgba(0, 0, 0, 0.7)',
        // Glows coloridos
        'glow-fisica': '0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.1)',
        'glow-matematica': '0 0 20px rgba(224, 64, 251, 0.3), 0 0 40px rgba(224, 64, 251, 0.1)',
        'glow-orange': '0 0 20px rgba(255, 107, 44, 0.3), 0 0 40px rgba(255, 107, 44, 0.1)',
        'glow-success': '0 0 20px rgba(0, 230, 118, 0.3)',
        'glow-error': '0 0 20px rgba(255, 82, 82, 0.3)',
        // Inner glow
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'inner-glow-fisica': 'inset 0 0 20px rgba(0, 229, 255, 0.1)',
        'inner-glow-matematica': 'inset 0 0 20px rgba(224, 64, 251, 0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        // Gradientes para dark mode
        'gradient-dark': 'linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)',
        'gradient-radial-dark': 'radial-gradient(ellipse at center, #1A1A24 0%, #0A0A0F 70%)',
        'gradient-fisica': 'linear-gradient(135deg, #00E5FF 0%, #00A8C2 100%)',
        'gradient-matematica': 'linear-gradient(135deg, #E040FB 0%, #AA00FF 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FF6B2C 0%, #FF8A5B 100%)',
        // Grid sutil para fundo
        'grid-dark': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.03'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        // Noise texture
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
