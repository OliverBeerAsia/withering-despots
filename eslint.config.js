import js from "@eslint/js";
import tseslint from "typescript-eslint";

const typescriptFiles = ["**/*.ts"];

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      // Standalone art-generation scripts (run via tsx) outside the app tsconfig;
      // the typed lint project service cannot parse them.
      "art/source/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    ...js.configs.recommended,
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: typescriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
