/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./packages/config/eslint/base.js"],
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
};
