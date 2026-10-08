import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#070b1a",
          900: "#0b1128",
          800: "#131b3d",
          700: "#1e2a5a",
        },
        star: {
          DEFAULT: "#ffe9a8",
          soft: "#fff6d9",
          dim: "#c9b98a",
        },
        paper: {
          DEFAULT: "#f6ecd9",
          dark: "#e8d9bd",
        },
        wood: {
          DEFAULT: "#7a5230",
          dark: "#4e3319",
          light: "#a97c50",
        },
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
        body: ["ui-rounded", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(255, 233, 168, 0.35)",
        soft: "0 10px 40px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        cozy: "1.25rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        sway: "sway 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
