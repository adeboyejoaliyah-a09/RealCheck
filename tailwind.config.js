/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        realblack: "#0a0a0f",
        realpanel: "#101019",
        realline: "#26263a",
        realindigo: "#6366f1"
      },
      fontFamily: {
        mono: [
          "DM Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      }
    }
  },
  plugins: []
};
