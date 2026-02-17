module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "shared/(.*)": "<rootDir>/../shared/$1",
    "src/(.*)": "<rootDir>/src/$1",
  },
};
