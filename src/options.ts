// import type { JSONSchemaType } from "@typespec/compiler"; // TODO: Fix type issues
import type { AsyncAPIEmitterOptions } from "./types/options.js";

// Export the interface type
export type { AsyncAPIEmitterOptions };

/**
 * Secure JSONSchemaType validation for AsyncAPI emitter options.
 * Prevents arbitrary configuration injection and ensures type safety.
 * 
 * SECURITY NOTE: additionalProperties is set to false to prevent 
 * arbitrary configuration injection attacks.
 */
export const AsyncAPIEmitterOptionsSchema = {
  type: "object",
  additionalProperties: false, // CRITICAL SECURITY: prevent arbitrary properties
  properties: {
    "output-file": {
      type: "string",
      nullable: true,
      description: "Name of the output file. Default: 'asyncapi.yaml'"
    },
    "file-type": {
      type: "string",
      enum: ["yaml", "json"],
      nullable: true,
      description: "Output file type. Default: 'yaml'"
    },
    "asyncapi-version": {
      type: "string",
      enum: ["3.0.0"],
      nullable: true,
      description: "AsyncAPI version to target. Default: '3.0.0'"
    },
    "omit-unreachable-types": {
      type: "boolean",
      nullable: true,
      description: "Whether to omit unreachable message types. Default: false"
    },
    "include-source-info": {
      type: "boolean",
      nullable: true,
      description: "Whether to include TypeSpec source information in comments. Default: false"
    },
    "default-servers": {
      type: "object",
      additionalProperties: true,
      nullable: true,
      required: [],
      description: "Custom servers to include in the output"
    },
    "validate-spec": {
      type: "boolean",
      nullable: true,
      description: "Whether to validate generated AsyncAPI spec. Default: true"
    },
    "additional-properties": {
      type: "object",
      additionalProperties: true,
      nullable: true,
      required: [],
      description: "Additional schema properties to include"
    },
    "protocol-bindings": {
      type: "array",
      items: {
        type: "string",
        enum: ["kafka", "amqp", "websocket", "http"]
      },
      nullable: true,
      uniqueItems: true,
      description: "Protocol bindings to include"
    },
    "security-schemes": {
      type: "object",
      additionalProperties: true,
      nullable: true,
      required: [],
      description: "Security schemes configuration"
    },
    "versioning": {
      type: "object",
      additionalProperties: false,
      nullable: true,
      required: [],
      properties: {
        "separate-files": {
          type: "boolean",
          nullable: true,
          description: "Whether to generate separate files for each version. Default: true"
        },
        "file-naming": {
          type: "string",
          enum: ["suffix", "directory", "prefix"],
          nullable: true,
          description: "Version naming strategy for file output. Default: 'suffix'"
        },
        "include-version-info": {
          type: "boolean",
          nullable: true,
          description: "Whether to include version metadata in AsyncAPI info. Default: true"
        },
        "version-mappings": {
          type: "object",
          additionalProperties: { type: "string" },
          nullable: true,
          required: [],
          description: "Custom version mappings"
        },
        "validate-version-compatibility": {
          type: "boolean",
          nullable: true,
          description: "Whether to validate version compatibility. Default: false"
        }
      },
      description: "Versioning configuration"
    }
  }
} as any; // TODO: Fix JSONSchemaType compatibility