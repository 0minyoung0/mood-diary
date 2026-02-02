/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mood: {
          happy: '#FFD93D',
          sad: '#6BCB77',
          angry: '#FF6B6B',
          anxious: '#9B59B6',
          neutral: '#A0A0A0',
        }
      }
    },
  },
  plugins: [],
}
