/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", //
  theme: {
    fontFamily: {
      mono: "Chivo Mono, monospace",
      overpass: "Overpass, sans-serif",
      roboto: "Roboto, sans-serif",
    },
    colors: {
      fg_top_color: "var(--fg_top_color)",
      fg_middle_color: "var(--fg_middle_color)",
      fg_above_color: "var(--fg_above_color)",
      fg_below_color: "var(--fg_below_color)",
      border_color: "var(--border_color)",
      bg_color: "var(--bg_color)",
      primary_color: "var(--primary_color)",

      white: "#fff",
      gray_lighter: "#cfcfcf",
      gray_light: "#afafaf",
      gray: "#808080",
      gray_dark: "#4a4a4a",
      gray_darker: "#202020",
      black: "#121212",
      green: "#3fb68b",
      blue: "#007bff",
      green_lighter: "#26de81",
      red_lighter: "#ff231f",
      yellow: "#F0B90B",
      /* --green: var(--turquoise); */
      red: "#ff5353",
      turquoise_lighter: "#65fff2",
      turquoise_light: "#02e7d7",
      turquoise: "#08acc2",
      turquoise_dark: "#0a6aa1",
      turquoise_darker: "#06366d",
    },
    extend: {
      boxShadow: {
        green: "0 0 15px 0 #26de81ad;",
        red: "0 0 15px 0 #ff231fad;",
        green_dark: "0 0 10px 0 #26de81ad;",
        red_dark: "0 0 10px 0 #ff231fad;",
        blue: "0 0 15px 0 #007bffad;",
      },
      screens: {
        xs: "360px",
        xsh: { raw: `(min-height: 360px)` },
        smh: { raw: `(min-height: 600px)` },
        mdh: { raw: `(min-height: 960px)` },
        lgh: { raw: `(min-height: 1280px)` },
        xlh: { raw: `(min-height: 1920px)` },
      },
    },
  },
  plugins: [],
};
