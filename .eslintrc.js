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
        //'plugin:@typescript-eslint/recommended-requiring-type-checking',
        //'plugin:rxjs/recommended',
        "prettier",
      ],
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          "./front/tsconfig.json",
          "./back/tsconfig.json",
          "./shared/tsconfig.json",
          "./libs/react-design-system/tsconfig.json",
        ],
        ecmaVersion: 2020,
        sourceType: "module",
      },
      plugins: ["@typescript-eslint" /*'rxjs'*/],
      rules: {
        ...require("./.eslint/eslint.rules"),
        ...require("./.eslint/typescript-eslint.rules"),
        //...require('./.eslint/eslint.rules'),
        //...require('./.eslint/typescript-eslint.rules'),
        //...require('./.eslint/angular-eslint.rules'),
        //...require('./.eslint/rxjs-eslint.rules'),
        //...require('./.eslint/rxjs-angular-eslint.rules')
      },
    },
    {
      files: ["**/InMemory*.ts", "**/*Stub*.ts", "**/pg/migrations/*.ts"],
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
        ...require("./.eslint/typescript-eslint-test.rules"),
        ...require("./.eslint/jest-eslint.rules"),
      },
    },
    /*{
      files: ['*.html'],
      parser: '@angular-eslint/template-parser',
      plugins: ['@angular-eslint/template'],
      rules: {
        ...require('./.eslint/angular-template-eslint.rules')
      }
    }*/
  ],
};
