/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#080c0a",
        foreground: "#fcfcfc",
        primary: "#10b981",
        gold: "#f59e0b",
        surface: "#0f1714",
        "surface-elevated": "#141d1a",
        border: "rgba(16, 185, 129, 0.2)",
        muted: "#4b5563",
        "muted-foreground": "#7d8a84",
      },
      fontFamily: {
        display: ["Display-Bold"],
        medium: ["Display-Medium"],
        regular: ["Display-Regular"],
      },
    },
  },
  plugins: [],
};
