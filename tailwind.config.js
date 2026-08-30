/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#06070B",
          900: "#0B0E16",
          800: "#12151F",
          700: "#1A1E2B",
          600: "#252A3A",
          500: "#343B4F",
        },
        volt: {
          400: "#8B7BFF",
          500: "#7C5CFF",
          600: "#6440FF",
        },
        cyan: {
          400: "#4DEFFF",
          500: "#00E5FF",
          600: "#00B8CC",
        },
        live: {
          400: "#FF6B85",
          500: "#FF3B5C",
          600: "#E01E42",
        },
        gold: {
          400: "#FFD37A",
          500: "#FFC145",
          600: "#E8A020",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        hud: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(124,92,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.06) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(124,92,255,0.25), transparent 60%)",
      },
      boxShadow: {
        "glow-volt": "0 0 20px rgba(124,92,255,0.5), 0 0 60px rgba(124,92,255,0.15)",
        "glow-cyan": "0 0 20px rgba(0,229,255,0.45), 0 0 60px rgba(0,229,255,0.12)",
        "glow-live": "0 0 20px rgba(255,59,92,0.55), 0 0 50px rgba(255,59,92,0.2)",
        "glow-gold": "0 0 18px rgba(255,193,69,0.4)",
      },
      animation: {
        "pulse-live": "pulse-live 1.6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.6, transform: "scale(0.85)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
