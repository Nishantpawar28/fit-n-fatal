import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fnf: {
          bg: '#0D0D14',
          surface: '#13121F',
          purple: '#8B2BFF',
          violet: '#C84BFF',
          pink: '#FF6BAA',
          green: '#00FFA0',
          text: '#F0EEFF',
          muted: '#6B5A8A',
          secondary: '#D0C8E8',
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
