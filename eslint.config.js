import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow `any` type - phase 2 dev, we'll refine types iteratively
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow setState in effects - standard pattern for data fetching
      "react-hooks/set-state-in-effect": "warn",
      // Allow unescaped apostrophes in JSX text
      "react/no-unescaped-entities": "warn",
      // Allow unused vars (common during rapid dev)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
