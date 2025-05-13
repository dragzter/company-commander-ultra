import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["eslint.config.js"],
  },
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: globals.browser,
    },
    rules: {
      // your custom rules here (optional)
    },
  },

  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
]);
