/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./typescript.js", "./react.js"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "no-undef": "off", // TypeScript handles this
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
