module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-design-system/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        immersionBlue: {
          light: "#417dc4",
          dark: "#3458a2", // #090091 (maybe but much darker) ?
          DEFAULT: "#3f79c1",
        },
        immersionRed: {
          light: "#ce614a",
          dark: "#ad4847",
          veryDark: "#823434",
          DEFAULT: "#be5449",
        },
        immersionGrey: {
          light: "lightgrey",
          dark: "darkgrey",
          DEFAULT: "grey",
        },
      },
    },
  },
  plugins: [],
};
