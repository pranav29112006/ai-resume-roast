/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          light: '#fda4af',
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
        }
      }
    },
  },
  plugins: [],
}
