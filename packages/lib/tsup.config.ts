import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/utils.ts", "src/constants.ts", "src/supabase/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2020",
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".js",
    }
  },
  esbuildOptions(options) {
    // Ensure we're building for ESM
    options.platform = "browser"
    options.format = "esm"
  },
}) 