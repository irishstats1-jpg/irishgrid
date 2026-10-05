import type { Config } from 'tailwindcss';

// Irish Grid brand tokens (Brand Book, October 2026): "Green is the grid.
// Orange is the fix." Grid Green carries every figure about waste, compensation
// and the grid; Block Orange is reserved for the Bitcoin counterpart; Paper is
// the neutral ground for sources and methods; fossil generation is grey.
// Body-size coloured text uses the 700 step (base 500s are below 4.5:1 on paper).
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
          700: '#0D6440', // text step
          800: '#0A4A2F',
          900: '#062E1D', // Peat
        },
        orange: {
          100: '#FEF1E2',
          200: '#FDDFBD',
          300: '#FCC88C',
          400: '#F9AE55',
          500: '#F7931A', // Block Orange — Bitcoin orange
          600: '#DB7A0A',
          700: '#9C5306', // text step
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
