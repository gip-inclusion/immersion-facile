process.env.TZ = "Europe/Paris";

module.exports = {
  testEnvironment: "jest-environment-node-single-context",
    transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
