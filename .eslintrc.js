// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  ignorePatterns: ["apps/**", "packages/**"],
  env: {
    node: true,
  },
  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    ".turbo/**",
    "*.config.js",
    "!.eslintrc.js",
    "!commitlint.config.js",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
