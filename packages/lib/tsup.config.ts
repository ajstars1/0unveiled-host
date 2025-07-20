import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/utils.ts", "src/constants.ts", "src/supabase/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react"],
}) 