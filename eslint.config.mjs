import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "prefer-const": "error",
    },
  },
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "semi": "error",
      "indent": ["error", 2],
      "no-trailing-spaces": "error",
      "quotes": ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
]);

export default eslintConfig;
