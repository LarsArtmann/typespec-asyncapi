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

      // === MAXIMUM TYPESCRIPT STRICTNESS ===
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      // === EFFECT.TS COMPATIBLE PATTERNS ===
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-non-null-assertion": "error",

      // === CODE QUALITY ENFORCEMENT ===
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",

      // === CONSISTENT CODE STYLE ===
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      // === MODERN JAVASCRIPT/TYPESCRIPT FEATURES ===
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",

      // === PERFORMANCE & BEST PRACTICES ===
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",

      // === DISABLE CONFLICTING RULES ===
      "no-unused-vars": "off", // Use @typescript-eslint version
      "no-undef": "off", // TypeScript handles this
      "no-redeclare": "off", // Use @typescript-eslint version
      "@typescript-eslint/no-redeclare": "error",

      // === ARRAY AND OBJECT HANDLING ===
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/no-for-in-array": "error",

      // === NAMING CONVENTIONS ===
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
      ],

      // === ERROR PREVENTION ===
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: false,
          allowAny: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],
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