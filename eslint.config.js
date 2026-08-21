import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test/**",
      "examples/**",
      "docs/**",
      "website/**",
      "*.config.js",
      "*.config.ts",
      "src/constants/generated-bindings.ts",
      ".tsbuildinfo",
      "**/*.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "src/**/*.tsx"],
  })),

  // EFv1 containment: @typespec/asset-emitter may only be imported by the
  // Schema-generation seam. Everything downstream consumes plain compiler
  // Types so the eventual direct-AST emitter (v0.4.0) swaps one seam.
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@typespec/asset-emitter",
              message:
                "EFv1 containment: import this only in schema-generator.ts, schema-emitter.ts, or extract-value.ts (the schema-generation seam).",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/schema-generator.ts",
      "src/schema-emitter.ts",
      "src/extract-value.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { disallowTypeAnnotations: false, prefer: "type-imports" },
      ],

      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
    },
  },
];
