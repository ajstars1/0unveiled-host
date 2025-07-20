/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "eslint-config-turbo"],
  plugins: ["only-warn"],
  rules: {
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
    ".turbo/",
    "build/",
    ".next/",
    "__pycache__/",
  ],
}; 