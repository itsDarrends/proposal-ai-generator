import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        // Theme palette: the existing slate/indigo/violet/purple utility classes are
        // remapped here so the whole app re-themes from one place.
        // slate -> near-neutral greys (white page, light panels, dark text)
        slate: {
          50: "#f7f7f5", 100: "#efeeea", 200: "#e2e1db", 300: "#c8c7bd", 400: "#a09f93",
          500: "#6f6f63", 600: "#57574c", 700: "#3b3b33", 800: "#26261f", 900: "#1a1a15", 950: "#11110e",
        },
        // indigo -> sage / forest green (primary accent)
        indigo: {
          50: "#eefbf2", 100: "#d5f5df", 200: "#aeeabf", 300: "#7bd99a", 400: "#4cc277",
          500: "#2ea35c", 600: "#238449", 700: "#1d683b", 800: "#195230", 900: "#144228", 950: "#0a2415",
        },
        // violet -> clay / terracotta (warm secondary accent)
        violet: {
          50: "#fdf2ee", 100: "#fadfd5", 200: "#f4bfaa", 300: "#ee9e80", 400: "#e8896a",
          500: "#d96d49", 600: "#bf5535", 700: "#9d442a", 800: "#7e3926", 900: "#683124", 950: "#38170f",
        },
        // purple -> dusty blue (used for the "signed" status)
        purple: {
          50: "#eff6fa", 100: "#d9e9f3", 200: "#b6d3e6", 300: "#8bb9d6", 400: "#6fa8c9",
          500: "#4f8db3", 600: "#3b7399", 700: "#315d7d", 800: "#2c4e69", 900: "#294258", 950: "#192a3a",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
  plugins: [require("@tailwindcss/typography")],
};
export default config;
