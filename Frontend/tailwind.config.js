import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9",   // sky blue
        accent: "#8b5cf6",    // violet
        darkbg: "#0f172a",
        lightbg: "#ffffff",
      },
    },
  },
  plugins: [
    typography,
  ],
}
