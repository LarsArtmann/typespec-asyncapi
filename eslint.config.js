// ESLint v9.0+ Flat Configuration
// TypeSpec AsyncAPI Project - Maximum TypeScript Strictness Configuration
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript recommended rules
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strict,
  
  // Apply to TypeScript files in src directory
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // === CRITICAL SAFETY RULES (ERRORS - BLOCK BUILDS) ===
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error", 
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",  
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // === CODE QUALITY RULES (WARNINGS - TRACK BUT DON'T BLOCK) ===
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/prefer-readonly": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-extraneous-class": "warn",

      // === CONSISTENT CODE STYLE (ERRORS) ===
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",

      // === MODERN JAVASCRIPT/TYPESCRIPT FEATURES (ERRORS) ===
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",

      // === DISABLE CONFLICTING BASE RULES ===
      "no-unused-vars": "off", // Use @typescript-eslint version
      "no-undef": "off", // TypeScript handles this
      "no-redeclare": "off", // Use @typescript-eslint version
      "require-yield": "off", // Allow generator functions without yield

      // === ARRAY AND OBJECT HANDLING ===
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/no-for-in-array": "error",

      // === NAMING CONVENTIONS (WARNINGS) ===
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variableLike",
          format: ["camelCase", "UPPER_CASE"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
      ],
      
      // === ERROR PREVENTION ===
      "@typescript-eslint/restrict-plus-operands": "error",
    },
  },
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test/**",
      "tests/**",
      "examples/**",
      "docs/**",
      "*.config.js",
      "*.config.ts",
      "vitest.config.ts",
      ".tsbuildinfo",
      "jscpd-report/**",
      "test-output/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.d.ts",
    ],
  },
];