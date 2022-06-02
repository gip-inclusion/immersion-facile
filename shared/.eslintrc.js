module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  overrides: [
    {
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        ecmaVersion: 2020,
        sourceType: "module",
      },
      plugins: ["@typescript-eslint"],
      rules: {
        ...require("../.eslint/eslint.rules"),
        ...require("../.eslint/typescript-eslint.rules"),
      },
    },
    {
      files: ["**/InMemory*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        ecmaVersion: 2020,
        sourceType: "module",
      },
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/require-await": "off",
      },
    },
    {
      env: {
        "jest/globals": true,
      },
      extends: ["plugin:jest/recommended", "plugin:jest/style"],
      files: ["**/*.test.ts"],
      plugins: ["jest"],
      rules: {
        //...require("./.eslint/eslint-test.rules"),
        ...require("../.eslint/typescript-eslint-test.rules"),
        ...require("../.eslint/jest-eslint.rules"),
      },
    },
  ],
};
