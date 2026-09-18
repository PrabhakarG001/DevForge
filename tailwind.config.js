/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        ink: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        accent2: 'rgb(var(--c-accent-2) / <alpha-value>)',
        good: 'rgb(var(--c-good) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        bad: 'rgb(var(--c-bad) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--c-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 24px 60px -28px rgb(0 0 0 / 0.55)',
        'card-sm': '0 12px 32px -18px rgb(0 0 0 / 0.5)',
        glow: '0 0 24px -6px rgb(var(--c-accent) / 0.5)',
        'glow-sm': '0 0 16px -4px rgb(var(--c-accent) / 0.45)',
        'glow-accent2': '0 0 24px -6px rgb(var(--c-accent-2) / 0.5)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        blink: 'blink 1.1s step-end infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        shimmer: 'shimmer 2.6s linear infinite',
      },
    },
  },
  plugins: [],
};
