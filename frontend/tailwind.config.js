/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
        colors: {
        primary: "#4f46e5",
        secondary: "#9333ea",
      },
    },
  },
  plugins: [],
}
