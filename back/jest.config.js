module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
