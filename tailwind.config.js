/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Validated palette (dataviz skill, references/palette.md) - status colors are fixed and
        // never reused for chart series; categorical slots are used only for the trend chart's
        // pollutant identity (CO/PM2.5/PM10), in fixed order, never cycled.
        surface: { DEFAULT: "#fcfcfb", dark: "#1a1a19" },
        page: { DEFAULT: "#f9f9f7", dark: "#0d0d0d" },
        ink: {
          primary: "#0b0b0b",
          "primary-dark": "#ffffff",
          secondary: "#52514e",
          "secondary-dark": "#c3c2b7",
          muted: "#898781",
        },
        gridline: "#e1e0d9",
        baseline: "#c3c2b7",
        status: {
          good: "#0ca30c",
          warning: "#fab219",
          serious: "#ec835a",
          critical: "#d03b3b",
        },
        series: {
          1: "#2a78d6", // blue - CO
          2: "#1baf7a", // aqua - PM2.5
          3: "#eda100", // yellow - PM10
        },

        // shadcn/ui-style semantic tokens - the primitive components in components/ui/* are written
        // against these names (bg-background, border-input, etc). Mapped onto the same validated
        // palette above rather than a second, separate color system - e.g. "border" IS "gridline",
        // just exposed under the name Radix/shadcn conventions expect.
        border: "#e1e0d9",
        input: "#c3c2b7",
        ring: "#2a78d6",
        background: "#f9f9f7",
        foreground: "#0b0b0b",
        primary: { DEFAULT: "#0b0b0b", foreground: "#ffffff" },
        secondary: { DEFAULT: "#f0efec", foreground: "#0b0b0b" },
        destructive: { DEFAULT: "#d03b3b", foreground: "#ffffff" },
        muted: { DEFAULT: "#f0efec", foreground: "#898781" },
        accent: { DEFAULT: "#f0efec", foreground: "#0b0b0b" },
        popover: { DEFAULT: "#fcfcfb", foreground: "#0b0b0b" },
        card: { DEFAULT: "#fcfcfb", foreground: "#0b0b0b" },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        // "Atmospheric" brand gradient (blue -> aqua, the trend chart's own CO/PM2.5 series colors)
        // used sparingly for brand accents (header logo, hero card wash) - not a general-purpose
        // utility, so it stays out of the flat color palette above.
        "brand-gradient": "linear-gradient(135deg, #2a78d6 0%, #1baf7a 100%)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
