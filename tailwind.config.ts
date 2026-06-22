import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        "bg-app": "var(--bg-app)",
        "bg-sidebar": "var(--bg-sidebar)",
        "bg-header": "var(--bg-header)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-input": "var(--bg-input)",
        "border-soft": "var(--border-soft)",
        "border-mid": "var(--border-mid)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        brand: "var(--color-brand)",
        "brand-alt": "var(--color-brand-alt)",
        credit: "var(--color-credit)",
        debit: "var(--color-debit)",
      },
    },
  },
  plugins: [],
};
export default config;
