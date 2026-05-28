/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a2e",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a0a0b0",
          muted: "#606070",
        },
        accent: {
          primary: "#00ff88",
          secondary: "#ff6b6b",
          tertiary: "#6b8bff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
