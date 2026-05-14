/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a72e8',
          dark: '#1557b0',
          light: '#e8f0fe',
        },
        navy: {
          DEFAULT: '#0f1e35',
          light: '#1a2b4b',
        },
        gold: {
          DEFAULT: '#d4a832',
          light: '#f9f1d7',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}
