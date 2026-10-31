import type { Config } from "tailwindcss";

const v = (n: string) => `var(--${n})`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), card: v("card"), ink: v("ink"), muted: v("muted"), line: v("line"),
        brand: v("brand"), on: v("on"), soft: v("soft"), hero: v("hero"), hero2: v("hero2"),
        code: v("code"), warn: v("warn"), warnl: v("warnl"), warni: v("warni"),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', "Tahoma", '"Segoe UI"', "system-ui", "sans-serif"],
      },
      maxWidth: { site: "1180px" },
    },
  },
  plugins: [],
};

export default config;
