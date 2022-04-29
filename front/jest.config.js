module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "shared/(.*)": "<rootDir>/../shared/$1",
    "src/(.*)": "<rootDir>/src/$1",
  },
};
