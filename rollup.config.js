import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.js",
  output: {
    file: "./main/main.min.js",
    format: "iife",
    name: "Blanket",

    inlineDynamicImports: true,
    sourcemap: true,
    globals: {
      "@supabase/supabase-js": "Supabase",
    },
  },
  external: ["@supabase/supabase-js"],
  plugins: [resolve(), commonjs(), json(), terser()],
};
