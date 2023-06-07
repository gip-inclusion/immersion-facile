module.exports = {
  "jest/expect-expect": [
    "error",
    {
      assertFunctionNames: ["expect*", "test*", "request.**.expect"],
    },
  ],
  "jest/max-nested-describe": [
    "error",
    {
      // TODO Descendre à trois un jour pour clean
      max: 4,
    },
  ],
  "jest/no-alias-methods": "error",
  "jest/no-commented-out-tests": "off",
  "jest/no-duplicate-hooks": "error",
  "jest/no-if": "error",
  "jest/no-large-snapshots": ["error", { maxSize: 12, inlineMaxSize: 6 }],
  "jest/no-test-return-statement": "error",
  "jest/prefer-called-with": "error",
  "jest/prefer-hooks-on-top": "error",
  "jest/prefer-lowercase-title": "off",
  "jest/prefer-spy-on": "error",
  "jest/prefer-to-be": "error",
  "jest/prefer-to-contain": "error",
  "jest/prefer-to-have-length": "error",
  "jest/prefer-todo": "off",
  "jest/require-hook": "off",
  "jest/require-to-throw-message": "off",
  "jest/require-top-level-describe": "error",
};

const toDiscuss = {
  "jest/prefer-lowercase-title": [
    "error",
    {
      ignoreTopLevelDescribe: true,
    },
  ],
  "jest/prefer-strict-equal": "error",
  "jest/no-hooks": [
    "error",
    {
      allow: ["beforeEach", "afterEach"],
    },
  ],
};

const toBetterConfigure = {};
