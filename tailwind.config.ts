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
        // Calm Design - Paleta Minimalista
        calm: {
          bg: '#FAFAFA',           // Background principal - off-white
          surface: '#FFFFFF',       // Cards e superfícies
          elevated: '#F5F5F5',      // Elementos elevados sutis
          border: '#E5E7EB',        // Bordas suaves
          divider: '#F0F0F0',       // Divisores quase invisíveis
        },
        // Texto - Hierarquia clara
        text: {
          primary: '#1F2937',       // Texto principal - cinza escuro
          secondary: '#6B7280',     // Texto secundário
          muted: '#9CA3AF',         // Texto terciário
          disabled: '#D1D5DB',      // Texto desabilitado
        },
        // Física - Teal Sóbrio (transmite ciência/precisão)
        fisica: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#0891B2',           // Cor principal - teal profissional
          600: '#0E7490',
          700: '#155E75',
          800: '#164E63',
          900: '#134E4A',
        },
        // Matemática - Violet Elegante (transmite lógica/abstração)
        matematica: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',           // Cor principal - violet elegante
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },
        // Accent - Apenas para CTAs e ações importantes
        accent: {
          orange: '#F97316',        // CTA principal
          coral: '#FB923C',         // CTA hover
        },
        // Estados - Sutis e funcionais
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'micro': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      animation: {
        // Apenas animações sutis e funcionais
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shake': 'shake 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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
        // Sombras sutis - quase imperceptíveis
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'elevated': '0 4px 16px 0 rgba(0, 0, 0, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        'focus': '0 0 0 3px rgba(249, 115, 22, 0.15)',
        'focus-fisica': '0 0 0 3px rgba(8, 145, 178, 0.15)',
        'focus-matematica': '0 0 0 3px rgba(124, 58, 237, 0.15)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

export default config
