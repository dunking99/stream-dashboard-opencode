/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./workshop.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b10',
          900: '#0b1118',
          850: '#0f1720',
          800: '#131d27',
          700: '#1b2836',
          600: '#26384a',
        },
        line: '#213040',
        muted: '#8ea1b5',
        accent: {
          DEFAULT: '#4fa3ff',
          soft: '#16324f',
        },
        live: '#ff5d6c',
        mint: '#54d9a4',
        amber: '#f0c05a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Barlow Condensed', 'Arial Narrow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
