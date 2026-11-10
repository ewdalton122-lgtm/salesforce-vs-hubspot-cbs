import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          blue: 'var(--sf-blue)',
          electric: 'var(--sf-electric)',
          cloud: 'var(--sf-cloud)',
          sky: 'var(--sf-sky)',
          ice: 'var(--sf-ice)',
          deep: 'var(--sf-deep)',
        },
        night: { 950: 'var(--ink-950)', 900: 'var(--ink-900)', dim: 'var(--ink-text-dim)' },
        paper: { 0: 'var(--paper-0)', 1: 'var(--paper-1)' },
        ink: 'var(--ink)',
        hs: {
          card: 'var(--hs-card)',
          line: 'var(--hs-line)',
          text: 'var(--hs-text)',
          text2: 'var(--hs-text-2)',
          chip: 'var(--hs-chip)',
        },
      },
      fontFamily: {
        sans: ['"Salesforce Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: { card: '28px' },
      maxWidth: { site: '1240px' },
    },
  },
  plugins: [],
} satisfies Config;
