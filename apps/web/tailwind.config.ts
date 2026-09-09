import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fnf: {
          bg: 'rgb(var(--fnf-bg) / <alpha-value>)',
          surface: 'rgb(var(--fnf-surface) / <alpha-value>)',
          purple: 'rgb(var(--fnf-purple) / <alpha-value>)',
          violet: 'rgb(var(--fnf-violet) / <alpha-value>)',
          pink: 'rgb(var(--fnf-pink) / <alpha-value>)',
          green: 'rgb(var(--fnf-green) / <alpha-value>)',
          text: 'rgb(var(--fnf-text) / <alpha-value>)',
          muted: 'rgb(var(--fnf-muted) / <alpha-value>)',
          secondary: 'rgb(var(--fnf-secondary) / <alpha-value>)',
        },
      },
      fontFamily: {
        heading: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
