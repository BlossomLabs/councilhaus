import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import colors from "tailwindcss/colors";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: colors.yellow[500],
        input: colors.gray[800],
        ring: colors.gray[800],
        background: colors.gray[800],
        foreground: colors.gray[100],
        primary: {
          DEFAULT: colors.yellow[400],
          foreground: colors.gray[900],
        },
        secondary: {
          DEFAULT: colors.gray[700],
          foreground: colors.gray[100],
        },
        destructive: {
          DEFAULT: colors.red[500],
          foreground: colors.gray[100],
        },
        muted: {
          DEFAULT: colors.gray[700],
          foreground: colors.gray[400],
        },
        accent: {
          DEFAULT: colors.yellow[500],
          foreground: colors.gray[900],
        },
        popover: {
          DEFAULT: colors.gray[700],
          foreground: colors.gray[100],
        },
        card: {
          DEFAULT: colors.gray[900],
          foreground: colors.gray[100],
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
