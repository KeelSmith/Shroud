// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Architectural invariant: the pure core must not perform I/O or process control.
      // (encode architectural invariants as lint rules)
      "no-console": "error",
      "no-process-exit": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    // Plain JS/MJS (config files) are not part of the typed program — turn off
    // type-aware rules for them so the project service doesn't require a tsconfig entry.
    files: ["**/*.mjs", "**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Tests and config may be looser where it aids clarity — including loosely-typed test
    // doubles of the untyped external SDK surfaces (mirrors the wrapper relaxation, ADR-0004).
    files: ["tests/**/*.ts", "**/*.config.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    // SDK adapters wrap UNTYPED external client surfaces via structural typing + Proxy
    // dispatch; the type-aware "unsafe" rules fire on unavoidable dynamic access. Scoped,
    // documented divergence (ADR-0004 / Quality-Bar R5). The redaction logic itself stays
    // fully typed in `internal.ts`, which is deliberately NOT relaxed here.
    files: ["src/wrappers/openai.ts", "src/wrappers/anthropic.ts", "src/wrappers/ai.ts", "src/wrappers/proxy.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    // Runnable Node example scripts: console output and process exit codes are the point.
    files: ["examples/**"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
    },
  },
);
