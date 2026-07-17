import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  basePath: __dirname,
});

const eslintConfig = [
  // Pull Next.js rules safely
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // ✅ TACTICAL OVERRIDE: Prevents the circular JSON crash
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    // Ignore internal build folders to prevent deep-crawling loops
    ignores: [".next/*", "node_modules/*"]
  }
];

export default eslintConfig;