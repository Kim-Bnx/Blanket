import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js",
  output: {
    file: "./main/main.min.js",
    format: "iife",
    name: "Blanket",

    inlineDynamicImports: true,
  },
  plugins: [resolve(), commonjs()],
};
