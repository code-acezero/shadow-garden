import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  basePath: __dirname,
});

const eslintConfig = [
  // Pull Next.js rules safely
  ...compat.extends("next/core-web-vitals", "next/typescript"),
const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
      // ✅ TACTICAL OVERRIDE: Prevents the circular JSON crash
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "react/no-unescaped-entities": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
      }
  ...nextVitals,
      ...nextTs,
  {
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "react/no-unescaped-entities": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
    {
      // Ignore internal build folders to prevent deep-crawling loops
      ignores: [".next/*", "node_modules/*"]
    }
  ];
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "node_modules/**",
  "android/**",
  "public/**",
  "scratch/**",
  "scripts/**",
  "3d assets/**",
]),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "android/**",
    "public/**",
    "scratch/**",
    "scripts/**",
    "3d assets/**",
    ".agents/**",
    ".agent/**",
    ".gemini/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
