import type { Config } from 'tailwindcss';

// Irish Grid brand tokens (Brand Book v2.0, October 2026). Mix: Paper 60%,
// Peat 20%, Grid Green 10%; Flex Orange is rare — the Bitcoin counterpart and
// the policy option only. Body-size coloured text uses the 700 text steps
// (#0B623D, #9A5200); the 500 base colours are below 4.5:1 on paper.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        green: {
          100: '#E8F5EE',
          200: '#C3E9D4',
          300: '#91D6B1',
          400: '#52BC88',
          500: '#169B62', // Grid Green — Irish flag green
          600: '#0E8253',
          700: '#0B623D', // text step (Grid Green text)
          800: '#0A4A2F',
          900: '#062E1D', // Peat
        },
        orange: {
          100: '#FEF1E2',
          200: '#FDDFBD',
          300: '#FCC88C',
          400: '#F9AE55',
          500: '#F7931A', // Flex Orange
          600: '#DB7A0A',
          700: '#9A5200', // text step (Flex Orange text)
          800: '#6E3B06',
          900: '#452404',
        },
        peat: {
          DEFAULT: '#062E1D', // dark fields, covers, header, footer
          light: '#0E4430', // hover / inset on peat
        },
        paper: '#F2F2F3', // the page ground
        ink: {
          DEFAULT: '#1D1F20', // body text, rules, gas
          50: '#F7F7F8',
          100: '#E6E7E8',
          200: '#D4D6D8',
          300: '#B5B8BB',
          400: '#8E9296',
          500: '#6B6F73', // lightest grey allowed for text
          600: '#4F5357',
          700: '#3A3D40',
          800: '#2A2C2E',
          900: '#1D1F20',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
