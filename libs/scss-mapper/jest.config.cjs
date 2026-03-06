process.env.TZ = "Europe/Paris";

module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
   transformIgnorePatterns: ["/node_modules/"],
};
