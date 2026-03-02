process.env.TZ = "Europe/Paris";

module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(m?[jt]sx?)$": ["@swc/jest"],
  },
  transformIgnorePatterns: [
    "node_modules\\/(?!(.pnpm|@|isomorphic-dompurify|parse5))",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs"],
};
