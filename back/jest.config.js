module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  watchPathIgnorePatterns: [
    "./src/adapters/secondary/data-test.json",
    "./src/adapters/secondary/app-data.json",
  ],
};
