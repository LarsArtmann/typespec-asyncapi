import { describe, expect, test } from "bun:test";
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/options.js";
import {
  ASYNC_API_EMITTER_OPTIONS_SCHEMA,
  createAsyncAPIEmitterOptions,
  isAsyncAPIEmitterOptions,
  parseAsyncAPIEmitterOptions,
  validateAsyncAPIEmitterOptions,
} from "../../src/infrastructure/configuration/options.js";

describe("AsyncAPI Emitter Options", () => {
  test("should validate minimal valid options", () => {
    const validOptions = {
      "output-file": "test-output",
      "file-type": "yaml" as const,
    };

    const result = parseAsyncAPIEmitterOptions(validOptions);
    expect(result).toEqual(validOptions);
  });

  test("should validate complete valid options", () => {
    const completeOptions: AsyncAPIEmitterOptions = {
      "output-file": "complete-api",
      "file-type": "json",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": true,
      "include-source-info": false,
      "validate-spec": true,
      "default-servers": {
        production: {
          host: "api.example.com",
          protocol: "https",
          description: "Production server",
        },
      },
      "additional-properties": {
        "custom-prop": "custom-value",
      },
      "protocol-bindings": ["kafka", "websocket"],
      "security-schemes": {
        oauth: {
          type: "oauth2",
          description: "OAuth2 authentication",
        },
      },
      versioning: {
        "separate-files": true,
        "file-naming": "suffix",
        "include-version-info": true,
        "version-mappings": {
          v1: "1.0.0",
          v2: "2.0.0",
        },
        "validate-version-compatibility": false,
      },
    };

    const result = parseAsyncAPIEmitterOptions(completeOptions);
    expect(result).toEqual(completeOptions);
  });

  test("should handle empty options object", () => {
    const result = parseAsyncAPIEmitterOptions({});
    expect(result).toEqual({});
  });

  test("should reject invalid file-type", () => {
    expect(() => parseAsyncAPIEmitterOptions({ "file-type": "xml" })).toThrow();
  });

  test("should reject invalid asyncapi-version", () => {
    expect(() =>
      parseAsyncAPIEmitterOptions({ "asyncapi-version": "2.0.0" }),
    ).toThrow();
  });

  test("should reject invalid protocol-bindings", () => {
    expect(() =>
      parseAsyncAPIEmitterOptions({
        "protocol-bindings": ["kafka", "invalid-protocol"],
      }),
    ).toThrow();
  });

  test("should reject invalid versioning file-naming", () => {
    expect(() =>
      parseAsyncAPIEmitterOptions({
        versioning: { "file-naming": "invalid-strategy" },
      }),
    ).toThrow();
  });

  test("should reject invalid security scheme type", () => {
    expect(() =>
      parseAsyncAPIEmitterOptions({
        "security-schemes": { invalid: { type: "invalid-type" } },
      }),
    ).toThrow();
  });

  test("validateAsyncAPIEmitterOptions should provide user-friendly error messages", () => {
    try {
      validateAsyncAPIEmitterOptions({ "file-type": "invalid" });
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const errorMessage = String(error);
      expect(errorMessage).toContain("Schema validation failed");
    }
  });

  test("createAsyncAPIEmitterOptions should apply defaults", () => {
    const result = createAsyncAPIEmitterOptions();

    expect(result).toMatchObject({
      "output-file": "asyncapi",
      "file-type": "yaml",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": false,
      "include-source-info": false,
      "validate-spec": true,
    });
  });

  test("createAsyncAPIEmitterOptions should merge with provided options", () => {
    const customOptions = {
      "output-file": "custom-output",
      "file-type": "json" as const,
    };

    const result = createAsyncAPIEmitterOptions(customOptions);

    expect(result).toMatchObject({
      "output-file": "custom-output",
      "file-type": "json",
      "asyncapi-version": "3.0.0",
      "validate-spec": true,
    });
  });

  test("isAsyncAPIEmitterOptions should return true for valid options", () => {
    expect(
      isAsyncAPIEmitterOptions({ "output-file": "test", "file-type": "yaml" }),
    ).toBe(true);
  });

  test("isAsyncAPIEmitterOptions should return false for invalid options", () => {
    expect(isAsyncAPIEmitterOptions({ "file-type": "invalid" })).toBe(false);
  });

  test("isAsyncAPIEmitterOptions should return false for non-object input", () => {
    expect(isAsyncAPIEmitterOptions("not an object")).toBe(false);
    expect(isAsyncAPIEmitterOptions(null)).toBe(false);
    expect(isAsyncAPIEmitterOptions(undefined)).toBe(false);
    expect(isAsyncAPIEmitterOptions(42)).toBe(false);
  });

  test("AsyncAPIEmitterOptionsSchema should be compatible with TypeSpec", () => {
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA).toHaveProperty("type", "object");
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA).toHaveProperty(
      "additionalProperties",
      false,
    );
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA).toHaveProperty("$defs");
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA).toHaveProperty("$ref");

    const defs = ASYNC_API_EMITTER_OPTIONS_SCHEMA.$defs as Record<string, any>;
    expect(defs).toHaveProperty("AsyncAPIEmitterOptions");
    const properties = defs.AsyncAPIEmitterOptions.properties as Record<
      string,
      unknown
    >;
    expect(properties).toHaveProperty("output-file");
    expect(properties).toHaveProperty("file-type");
    expect(properties).toHaveProperty("asyncapi-version");
    expect(properties).toHaveProperty("protocol-bindings");
    expect(properties).toHaveProperty("versioning");
  });

  test("AsyncAPIEmitterOptionsSchema should maintain security properties", () => {
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA.additionalProperties).toBe(false);

    const defs = ASYNC_API_EMITTER_OPTIONS_SCHEMA.$defs as Record<string, any>;
    const properties = defs.AsyncAPIEmitterOptions.properties as Record<
      string,
      unknown
    >;
    expect(properties["file-type"]).toHaveProperty("enum", ["yaml", "json"]);
    expect(properties["asyncapi-version"]).toHaveProperty("enum", ["3.0.0"]);
  });

  test("should validate complex server configuration", () => {
    const serverOptions = {
      "default-servers": {
        production: {
          host: "api.production.com",
          protocol: "https",
          description: "Production API server",
          variables: {
            version: {
              description: "API version",
              default: "v1",
              enum: ["v1", "v2", "v3"],
              examples: ["v1", "v2"],
            },
          },
          security: ["oauth2", "apiKey"],
          bindings: {
            kafka: {
              topic: "user-events",
            },
          },
        },
      },
    };

    const result = parseAsyncAPIEmitterOptions(serverOptions);
    expect(result).toEqual(serverOptions);
  });

  test("should validate complex security scheme configuration", () => {
    const securityOptions = {
      "security-schemes": {
        oauth2: {
          type: "oauth2" as const,
          description: "OAuth2 with PKCE",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://auth.example.com/oauth/authorize",
              tokenUrl: "https://auth.example.com/oauth/token",
              refreshUrl: "https://auth.example.com/oauth/refresh",
              availableScopes: {
                read: "Read access",
                write: "Write access",
                admin: "Admin access",
              },
            },
          },
        },
        apiKey: {
          type: "apiKey" as const,
          description: "API Key authentication",
          name: "X-API-Key",
          in: "header" as const,
        },
      },
    };

    const result = parseAsyncAPIEmitterOptions(securityOptions);
    expect(result).toEqual(securityOptions);
  });

  test("should provide detailed error messages for nested validation failures", () => {
    const invalidNestedOptions = {
      versioning: {
        "separate-files": "not-a-boolean",
        "file-naming": "invalid-strategy",
      },
    };

    try {
      parseAsyncAPIEmitterOptions(invalidNestedOptions);
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const errorMessage = String(error);
      expect(errorMessage).toContain("separate-files");
      expect(errorMessage).toContain("file-naming");
    }
  });
});

describe("Path Template Validation Tests", () => {
  test("should validate path template with supported variables", () => {
    const pathTemplateOptions = {
      "output-file": "{project-root}/generated/{cmd}-asyncapi.yaml",
    };

    const result = parseAsyncAPIEmitterOptions(pathTemplateOptions);
    expect(result).toEqual(pathTemplateOptions);
  });

  test("should validate multiple template variables", () => {
    const complexPathOptions = {
      "output-file": "{emitter-name}/{cmd}/{project-root}/spec.json",
    };

    const result = parseAsyncAPIEmitterOptions(complexPathOptions);
    expect(result).toEqual(complexPathOptions);
  });

  test("should validate path without template variables", () => {
    const simplePathOptions = {
      "output-file": "simple-output-file.yaml",
    };

    const result = parseAsyncAPIEmitterOptions(simplePathOptions);
    expect(result).toEqual(simplePathOptions);
  });

  test("should reject path template with unsupported variables", () => {
    const invalidPathOptions = {
      "output-file": "{project-root}/{unknown-variable}/output.yaml",
    };

    expect(() => parseAsyncAPIEmitterOptions(invalidPathOptions)).toThrow();
  });

  test("should reject path template with multiple unsupported variables", () => {
    const invalidPathOptions = {
      "output-file": "{invalid1}/{invalid2}/{cmd}/output.yaml",
    };

    expect(() => parseAsyncAPIEmitterOptions(invalidPathOptions)).toThrow();
  });

  test("should provide detailed error message for invalid template variables", () => {
    const invalidPathOptions = {
      "output-file": "{unknown-var}/output.yaml",
    };

    try {
      parseAsyncAPIEmitterOptions(invalidPathOptions);
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const errorMessage = String(error);
      expect(errorMessage).toContain("Invalid path template");
      expect(errorMessage).toContain("unknown-var");
    }
  });

  test("should validate all supported template variables", () => {
    const allVariablesOptions = {
      "output-file":
        "{cmd}/{project-root}/{emitter-name}/{output-dir}/complete.yaml",
    };

    const result = parseAsyncAPIEmitterOptions(allVariablesOptions);
    expect(result).toEqual(allVariablesOptions);
  });

  test("should handle path templates with createAsyncAPIEmitterOptions", () => {
    const pathTemplateOptions = {
      "output-file": "{project-root}/specs/{cmd}-api.yaml",
      "file-type": "json" as const,
    };

    const result = createAsyncAPIEmitterOptions(pathTemplateOptions);

    expect(result).toMatchObject({
      "output-file": "{project-root}/specs/{cmd}-api.yaml",
      "file-type": "json",
      "asyncapi-version": "3.0.0",
      "validate-spec": true,
    });
  });

  test("should handle malformed template variables gracefully", () => {
    const malformedPathOptions = {
      "output-file": "path-with-no-template-variables.yaml",
    };

    const result = parseAsyncAPIEmitterOptions(malformedPathOptions);
    expect(result).toEqual(malformedPathOptions);
  });

  test("should validate complex nested paths with templates", () => {
    const nestedPathOptions = {
      "output-file":
        "{project-root}/api-specs/{emitter-name}/v1/{cmd}-generated.yaml",
    };

    const result = parseAsyncAPIEmitterOptions(nestedPathOptions);
    expect(result).toEqual(nestedPathOptions);
  });

  test("isAsyncAPIEmitterOptions should return true for valid path templates", () => {
    const validPathTemplateOptions = {
      "output-file": "{project-root}/generated/{cmd}.yaml",
      "file-type": "yaml",
    };

    expect(isAsyncAPIEmitterOptions(validPathTemplateOptions)).toBe(true);
  });

  test("isAsyncAPIEmitterOptions should return false for invalid path templates", () => {
    const invalidPathTemplateOptions = {
      "output-file": "{invalid-variable}/output.yaml",
    };

    expect(isAsyncAPIEmitterOptions(invalidPathTemplateOptions)).toBe(false);
  });
});

describe("Performance and Memory Tests", () => {
  test("schema validation should be performant for large option objects", () => {
    const largeOptions = {
      "default-servers": Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `server-${i}`,
          {
            host: `server-${i}.example.com`,
            protocol: "https",
            description: `Server ${i}`,
          },
        ]),
      ),
      "security-schemes": Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [
          `scheme-${i}`,
          {
            type: "apiKey" as const,
            name: `key-${i}`,
            in: "header" as const,
          },
        ]),
      ),
    };

    const start = performance.now();
    const result = parseAsyncAPIEmitterOptions(largeOptions);
    const duration = performance.now() - start;

    expect(result).toEqual(largeOptions);
    expect(duration).toBeLessThan(100);
  });

  test("schema should handle deeply nested configurations", () => {
    const deepOptions = {
      versioning: {
        "version-mappings": Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`v${i}`, `${i}.0.0`]),
        ),
      },
    };

    const result = parseAsyncAPIEmitterOptions(deepOptions);
    expect(result).toEqual(deepOptions);
  });
});
