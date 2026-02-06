import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate"; // <--- 1. Import it here

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
    
        
        // ✅ DYNAMIC FULL PALETTE
        // This maps every shade to a CSS variable, allowing full gradients/depth
        primary: {
          DEFAULT: "var(--primary-600)", // Default mainly used for buttons/text
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)", // Standard Brand Color
          600: "var(--primary-600)", // Hover States
          700: "var(--primary-700)", // Active States / Dark Gradients
          800: "var(--primary-800)",
          900: "var(--primary-900)", // Deep Backgrounds
          950: "var(--primary-950)", // Almost Black
          foreground: "#ffffff",
        },
        
        // ✅ SECONDARY PALETTE (Optional: Synced or Static)
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
      fontFamily: {
        primary: ["var(--font-primary)", "sans-serif"], 
        cinzel: ["var(--font-hunters)", "serif"],       
        inter: ["var(--font-inter)", "sans-serif"],  
        
        // Use the CSS variables injected by Next.js
        hunters: ["var(--font-hunters)"],
        badUnicorn: ["var(--font-bad-unicorn)"],
        demoness: ["var(--font-demoness)"],
        horrorshow: ["var(--font-horrorshow)"],
        kareudon: ["var(--font-kareudon)"],
        monas: ["var(--font-monas)"],
        nyctophobia: ["var(--font-nyctophobia)"],
        onePiece: ["var(--font-one-piece)"],
  
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
  plugins: [
    tailwindAnimate,
  ],
};

export default config;