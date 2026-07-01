import type { Config } from 'tailwindcss';

// Irish Grid design tokens (§13): blue-led — deep navy (authority/trust) +
// brighter sky/teal accent (water/wind) on a clean white background.
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b2545',
          50: '#eef2f8',
          100: '#d5e0ee',
          600: '#123a6b',
          700: '#0b2545',
          800: '#081b34',
          900: '#050f1f',
        },
        sky: {
          DEFAULT: '#2b9fd6',
          400: '#4db8e8',
          500: '#2b9fd6',
          600: '#1f80b0',
        },
        teal: {
          DEFAULT: '#17a2a2',
        },
        // Fuel-type palette for the map + charts
        fuel: {
          wind: '#2b9fd6',
          solar: '#f2b705',
          gas: '#e06d3b',
          hydro: '#3bb2a0',
          coal: '#4a4a4a',
          oil: '#8a5a44',
          other: '#8a8f98',
          imports: '#7d6bb0',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
