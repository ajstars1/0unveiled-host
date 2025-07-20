/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  env: {
    node: true,
  },
  rules: {
    "no-console": "off", // Allow console in Node.js
  },
}; 