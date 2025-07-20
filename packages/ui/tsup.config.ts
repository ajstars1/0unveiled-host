import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/button.tsx",
    "src/components/card.tsx", 
    "src/components/input.tsx",
    "src/components/label.tsx",
    "src/components/dialog.tsx",
    "src/components/toast.tsx",
    "src/lib/utils.ts",
    "src/hooks/use-mobile.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
});
