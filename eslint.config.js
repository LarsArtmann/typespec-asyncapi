// ESLint v9.0+ Flat Configuration
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "src/**/*.tsx"],
  })),

  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Type safety
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // Code quality
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { disallowTypeAnnotations: false, prefer: "type-imports" },
      ],

      // Disabled base rules
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
    },
  },

  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test/**",
      "examples/**",
      "docs/**",
      "*.config.js",
      "*.config.ts",
      "vitest.config.ts",
      "src/constants/generated-bindings.ts",
      ".tsbuildinfo",
      "**/*.d.ts",
    ],
  },
];
