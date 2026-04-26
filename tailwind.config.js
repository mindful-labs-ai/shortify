/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          50:  "var(--coral-50)",
          100: "var(--coral-100)",
          500: "var(--coral-500)",
          700: "var(--coral-700)",
          900: "var(--coral-900)",
        },
        yellow: {
          50:  "var(--yellow-50)",
          500: "var(--yellow-500)",
          900: "var(--yellow-900)",
        },
        mint: {
          50:  "var(--mint-50)",
          500: "var(--mint-500)",
          900: "var(--mint-900)",
        },
        sky: {
          500: "var(--sky-500)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          soft:    "var(--ink-soft)",
          mute:    "var(--ink-mute)",
          faint:   "var(--ink-faint)",
        },
        cream:  "var(--cream)",
        cloud:  "var(--cloud)",
        paper:  "var(--paper)",
        warm: {
          100: "var(--warm-100)",
          200: "var(--warm-200)",
          300: "var(--warm-300)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          strong:  "var(--hairline-strong)",
        },
        stamp: {
          soft: "var(--stamp-soft)",
          deep: "var(--stamp-deep)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono:    ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm:         "var(--shadow-sm)",
        md:         "var(--shadow-md)",
        lg:         "var(--shadow-lg)",
        coral:      "var(--shadow-coral)",
        "stamp-sm": "var(--shadow-stamp-sm)",
        "stamp-md": "var(--shadow-stamp-md)",
        "stamp-lg": "var(--shadow-stamp-lg)",
      },
    },
  },
  plugins: [],
};
