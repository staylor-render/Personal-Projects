/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        river: {
          50:  '#f0f9f4',
          100: '#dcf1e5',
          200: '#bbe3ce',
          300: '#8dcead',
          400: '#59b285',
          500: '#359764',
          600: '#257950',
          700: '#1e6141',
          800: '#1b4e35',
          900: '#17402c',
          950: '#0c2419',
        },
      },
    },
  },
  plugins: [],
};
