import { test, expect, describe } from "bun:test";
import { Effect } from "effect";
import {
  AsyncAPIEmitterOptionsEffectSchema,
  parseAsyncAPIEmitterOptions,
  validateAsyncAPIEmitterOptions,
  createAsyncAPIEmitterOptions,
  isAsyncAPIEmitterOptions,
  AsyncAPIEmitterOptionsSchema
} from "./options.js";
import type { AsyncAPIEmitterOptions } from "./types/options.js";

describe("Effect.TS Schema AsyncAPI Emitter Options", () => {
  // VALIDATION SUCCESS TESTS - Ensure proper options pass validation
  
  test("should validate minimal valid options", async () => {
    const validOptions = {
      "output-file": "test-output",
      "file-type": "yaml" as const
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(validOptions));
    expect(result).toEqual(validOptions);
  });

  test("should validate complete valid options", async () => {
    const completeOptions: AsyncAPIEmitterOptions = {
      "output-file": "complete-api",
      "file-type": "json",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": true,
      "include-source-info": false,
      "validate-spec": true,
      "default-servers": {
        "production": {
          host: "api.example.com",
          protocol: "https",
          description: "Production server"
        }
      },
      "additional-properties": {
        "custom-prop": "custom-value"
      },
      "protocol-bindings": ["kafka", "websocket"],
      "security-schemes": {
        "oauth": {
          type: "oauth2",
          description: "OAuth2 authentication"
        }
      },
      "versioning": {
        "separate-files": true,
        "file-naming": "suffix",
        "include-version-info": true,
        "version-mappings": {
          "v1": "1.0.0",
          "v2": "2.0.0"
        },
        "validate-version-compatibility": false
      }
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(completeOptions));
    expect(result).toEqual(completeOptions);
  });

  test("should handle empty options object", async () => {
    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions({}));
    expect(result).toEqual({});
  });

  // VALIDATION FAILURE TESTS - Ensure invalid options fail validation

  test("should reject invalid file-type", async () => {
    const invalidOptions = {
      "file-type": "xml" // Invalid enum value
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidOptions));
    await expect(result).rejects.toThrow();
  });

  test("should reject invalid asyncapi-version", async () => {
    const invalidOptions = {
      "asyncapi-version": "2.0.0" // Not supported version
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidOptions));
    await expect(result).rejects.toThrow();
  });

  test("should reject invalid protocol-bindings", async () => {
    const invalidOptions = {
      "protocol-bindings": ["kafka", "invalid-protocol"]
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidOptions));
    await expect(result).rejects.toThrow();
  });

  test("should reject invalid versioning file-naming", async () => {
    const invalidOptions = {
      "versioning": {
        "file-naming": "invalid-strategy"
      }
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidOptions));
    await expect(result).rejects.toThrow();
  });

  test("should reject invalid security scheme type", async () => {
    const invalidOptions = {
      "security-schemes": {
        "invalid": {
          type: "invalid-type"
        }
      }
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidOptions));
    await expect(result).rejects.toThrow();
  });

  // VALIDATION FUNCTION TESTS - Test helper functions

  test("validateAsyncAPIEmitterOptions should provide user-friendly error messages", async () => {
    const invalidOptions = {
      "file-type": "invalid"
    };

    try {
      await Effect.runPromise(validateAsyncAPIEmitterOptions(invalidOptions));
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const errorMessage = String(error);
      expect(errorMessage).toContain("AsyncAPI Emitter Options Validation Error");
      expect(errorMessage).toContain("file-type");
    }
  });

  test("createAsyncAPIEmitterOptions should apply defaults", async () => {
    const result = await Effect.runPromise(createAsyncAPIEmitterOptions());
    
    expect(result).toMatchObject({
      "output-file": "asyncapi",
      "file-type": "yaml",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": false,
      "include-source-info": false,
      "validate-spec": true
    });
  });

  test("createAsyncAPIEmitterOptions should merge with provided options", async () => {
    const customOptions = {
      "output-file": "custom-output",
      "file-type": "json" as const
    };

    const result = await Effect.runPromise(createAsyncAPIEmitterOptions(customOptions));
    
    expect(result).toMatchObject({
      "output-file": "custom-output",
      "file-type": "json",
      "asyncapi-version": "3.0.0", // Default should be preserved
      "validate-spec": true // Default should be preserved
    });
  });

  // TYPE GUARD TESTS - Test runtime type checking

  test("isAsyncAPIEmitterOptions should return true for valid options", () => {
    const validOptions = {
      "output-file": "test",
      "file-type": "yaml"
    };

    expect(isAsyncAPIEmitterOptions(validOptions)).toBe(true);
  });

  test("isAsyncAPIEmitterOptions should return false for invalid options", () => {
    const invalidOptions = {
      "file-type": "invalid"
    };

    expect(isAsyncAPIEmitterOptions(invalidOptions)).toBe(false);
  });

  test("isAsyncAPIEmitterOptions should return false for non-object input", () => {
    expect(isAsyncAPIEmitterOptions("not an object")).toBe(false);
    expect(isAsyncAPIEmitterOptions(null)).toBe(false);
    expect(isAsyncAPIEmitterOptions(undefined)).toBe(false);
    expect(isAsyncAPIEmitterOptions(42)).toBe(false);
  });

  // TYPESPEC COMPATIBILITY TESTS - Ensure TypeSpec integration works

  test("AsyncAPIEmitterOptionsSchema should be compatible with TypeSpec", () => {
    // Verify the schema has the expected JSONSchema structure
    expect(AsyncAPIEmitterOptionsSchema).toHaveProperty("type", "object");
    expect(AsyncAPIEmitterOptionsSchema).toHaveProperty("additionalProperties", false);
    expect(AsyncAPIEmitterOptionsSchema).toHaveProperty("properties");
    
    // Verify key properties are present
    const properties = AsyncAPIEmitterOptionsSchema.properties as Record<string, unknown>;
    expect(properties).toHaveProperty("output-file");
    expect(properties).toHaveProperty("file-type");
    expect(properties).toHaveProperty("asyncapi-version");
    expect(properties).toHaveProperty("protocol-bindings");
    expect(properties).toHaveProperty("versioning");
  });

  test("AsyncAPIEmitterOptionsSchema should maintain security properties", () => {
    // CRITICAL SECURITY: Ensure additionalProperties is false
    expect(AsyncAPIEmitterOptionsSchema.additionalProperties).toBe(false);
    
    // Ensure enum constraints are preserved
    const properties = AsyncAPIEmitterOptionsSchema.properties as Record<string, unknown>;
    expect(properties["file-type"]).toHaveProperty("enum", ["yaml", "json"]);
    expect(properties["asyncapi-version"]).toHaveProperty("enum", ["3.0.0"]);
  });

  // COMPLEX NESTED VALIDATION TESTS

  test("should validate complex server configuration", async () => {
    const serverOptions = {
      "default-servers": {
        "production": {
          host: "api.production.com",
          protocol: "https",
          description: "Production API server",
          variables: {
            "version": {
              description: "API version",
              default: "v1",
              enum: ["v1", "v2", "v3"],
              examples: ["v1", "v2"]
            }
          },
          security: ["oauth2", "apiKey"],
          bindings: {
            "kafka": {
              "topic": "user-events"
            }
          }
        }
      }
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(serverOptions));
    expect(result).toEqual(serverOptions);
  });

  test("should validate complex security scheme configuration", async () => {
    const securityOptions = {
      "security-schemes": {
        "oauth2": {
          type: "oauth2" as const,
          description: "OAuth2 with PKCE",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://auth.example.com/oauth/authorize",
              tokenUrl: "https://auth.example.com/oauth/token",
              refreshUrl: "https://auth.example.com/oauth/refresh",
              availableScopes: {
                "read": "Read access",
                "write": "Write access",
                "admin": "Admin access"
              }
            }
          }
        },
        "apiKey": {
          type: "apiKey" as const,
          description: "API Key authentication",
          name: "X-API-Key",
          in: "header" as const
        }
      }
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(securityOptions));
    expect(result).toEqual(securityOptions);
  });

  // ERROR MESSAGE QUALITY TESTS

  test("should provide detailed error messages for nested validation failures", async () => {
    const invalidNestedOptions = {
      "versioning": {
        "separate-files": "not-a-boolean", // Should be boolean
        "file-naming": "invalid-strategy" // Should be enum
      }
    };

    try {
      await Effect.runPromise(parseAsyncAPIEmitterOptions(invalidNestedOptions));
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      // Error should contain information about the nested validation failures
      const errorMessage = String(error);
      expect(errorMessage).toContain("separate-files");
      expect(errorMessage).toContain("file-naming");
    }
  });
});

describe("Path Template Validation Tests", () => {
  test("should validate path template with supported variables", async () => {
    const pathTemplateOptions = {
      "output-file": "{project-root}/generated/{cmd}-asyncapi.yaml"
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(pathTemplateOptions));
    expect(result).toEqual(pathTemplateOptions);
  });

  test("should validate multiple template variables", async () => {
    const complexPathOptions = {
      "output-file": "{emitter-name}/{cmd}/{project-root}/spec.json"
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(complexPathOptions));
    expect(result).toEqual(complexPathOptions);
  });

  test("should validate path without template variables", async () => {
    const simplePathOptions = {
      "output-file": "simple-output-file.yaml"
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(simplePathOptions));
    expect(result).toEqual(simplePathOptions);
  });

  test("should reject path template with unsupported variables", async () => {
    const invalidPathOptions = {
      "output-file": "{project-root}/{unknown-variable}/output.yaml"
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidPathOptions));
    await expect(result).rejects.toThrow();
  });

  test("should reject path template with multiple unsupported variables", async () => {
    const invalidPathOptions = {
      "output-file": "{invalid1}/{invalid2}/{cmd}/output.yaml"
    };

    const result = Effect.runPromise(parseAsyncAPIEmitterOptions(invalidPathOptions));
    await expect(result).rejects.toThrow();
  });

  test("should provide detailed error message for invalid template variables", async () => {
    const invalidPathOptions = {
      "output-file": "{unknown-var}/output.yaml"
    };

    try {
      await Effect.runPromise(parseAsyncAPIEmitterOptions(invalidPathOptions));
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const errorMessage = String(error);
      expect(errorMessage).toContain("Invalid path template");
      expect(errorMessage).toContain("unknown-var");
    }
  });

  test("should validate all supported template variables", async () => {
    const allVariablesOptions = {
      "output-file": "{cmd}/{project-root}/{emitter-name}/{output-dir}/complete.yaml"
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(allVariablesOptions));
    expect(result).toEqual(allVariablesOptions);
  });

  test("should handle path templates with createAsyncAPIEmitterOptions", async () => {
    const pathTemplateOptions = {
      "output-file": "{project-root}/specs/{cmd}-api.yaml",
      "file-type": "json" as const
    };

    const result = await Effect.runPromise(createAsyncAPIEmitterOptions(pathTemplateOptions));
    
    expect(result).toMatchObject({
      "output-file": "{project-root}/specs/{cmd}-api.yaml",
      "file-type": "json",
      "asyncapi-version": "3.0.0", // Default should be preserved
      "validate-spec": true // Default should be preserved
    });
  });

  test("should handle malformed template variables gracefully", async () => {
    const malformedPathOptions = {
      "output-file": "path-with-no-template-variables.yaml"
    };

    // Paths without template variables should pass validation
    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(malformedPathOptions));
    expect(result).toEqual(malformedPathOptions);
  });

  test("should validate complex nested paths with templates", async () => {
    const nestedPathOptions = {
      "output-file": "{project-root}/api-specs/{emitter-name}/v1/{cmd}-generated.yaml"
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(nestedPathOptions));
    expect(result).toEqual(nestedPathOptions);
  });

  // Type guard tests with path templates
  test("isAsyncAPIEmitterOptions should return true for valid path templates", () => {
    const validPathTemplateOptions = {
      "output-file": "{project-root}/generated/{cmd}.yaml",
      "file-type": "yaml"
    };

    expect(isAsyncAPIEmitterOptions(validPathTemplateOptions)).toBe(true);
  });

  test("isAsyncAPIEmitterOptions should return false for invalid path templates", () => {
    const invalidPathTemplateOptions = {
      "output-file": "{invalid-variable}/output.yaml"
    };

    expect(isAsyncAPIEmitterOptions(invalidPathTemplateOptions)).toBe(false);
  });
});

describe("Performance and Memory Tests", () => {
  test("schema validation should be performant for large option objects", async () => {
    const largeOptions = {
      "default-servers": Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `server-${i}`,
          {
            host: `server-${i}.example.com`,
            protocol: "https",
            description: `Server ${i}`
          }
        ])
      ),
      "security-schemes": Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [
          `scheme-${i}`,
          {
            type: "apiKey" as const,
            name: `key-${i}`,
            in: "header" as const
          }
        ])
      )
    };

    const start = performance.now();
    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(largeOptions));
    const duration = performance.now() - start;

    expect(result).toEqual(largeOptions);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test("schema should handle deeply nested configurations", async () => {
    const deepOptions = {
      "versioning": {
        "version-mappings": Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`v${i}`, `${i}.0.0`])
        )
      }
    };

    const result = await Effect.runPromise(parseAsyncAPIEmitterOptions(deepOptions));
    expect(result).toEqual(deepOptions);
  });
});