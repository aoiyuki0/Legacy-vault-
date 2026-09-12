/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#06090e',
          900: '#0c121d',
          850: '#111a28',
          800: '#162234',
          700: '#1e3049',
          600: '#2b4467',
          500: '#3b82f6',
          accent: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
