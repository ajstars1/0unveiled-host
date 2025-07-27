"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsup_1 = require("tsup");
exports.default = (0, tsup_1.defineConfig)({
    entry: ["src/utils.ts", "src/constants.ts", "src/supabase/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react"],
    plugins: [
    externalGlobalPlugin({
      'react': 'window.React',
      'react-dom': 'window.ReactDOM',
    })
  ]
});
