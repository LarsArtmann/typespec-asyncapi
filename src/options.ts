import type { JSONSchemaType } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./types/options.js";

const AsyncAPIEmitterOptionsSchema: JSONSchemaType<AsyncAPIEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": {
      type: "string",
      nullable: true,
      description: "Name of the output file. Default: asyncapi",
    },
    "file-type": {
      type: "string",
      enum: ["yaml", "json"],
      nullable: true,
      description: "Output file format. Default: yaml",
    },
    "asyncapi-version": {
      type: "string",
      enum: ["3.0.0"],
      nullable: true,
      description: "AsyncAPI specification version. Default: 3.0.0",
    },
    "omit-unreachable-types": {
      type: "boolean",
      nullable: true,
      description: "Whether to omit message types that are not referenced by any operations. Default: false",
    },
    "include-source-info": {
      type: "boolean",
      nullable: true,
      description: "Whether to include TypeSpec source file information in comments. Default: false",
    },
    "default-servers": {
      type: "object",
      nullable: true,
      description: "Default server configurations to include when no @server decorator is used",
      additionalProperties: {
        type: "object",
        properties: {
          host: { type: "string" },
          protocol: { type: "string" },
          description: { type: "string", nullable: true },
          variables: {
            type: "object",
            nullable: true,
            additionalProperties: {
              type: "object",
              properties: {
                description: { type: "string", nullable: true },
                default: { type: "string", nullable: true },
                enum: { 
                  type: "array", 
                  nullable: true,
                  items: { type: "string" }
                },
                examples: { 
                  type: "array", 
                  nullable: true,
                  items: { type: "string" }
                },
              },
              additionalProperties: false,
            },
          },
          security: {
            type: "array",
            nullable: true,
            items: { type: "string" },
          },
          bindings: {
            type: "object",
            nullable: true,
            additionalProperties: true,
          },
        },
        required: ["host", "protocol"],
        additionalProperties: false,
      },
    },
    "validate-spec": {
      type: "boolean",
      nullable: true,
      description: "Whether to validate the generated AsyncAPI specification. Default: true",
    },
    "additional-properties": {
      type: "object",
      nullable: true,
      description: "Additional properties to merge into the root AsyncAPI document",
      additionalProperties: true,
    },
    "protocol-bindings": {
      type: "array",
      nullable: true,
      description: "List of protocol bindings to include in the output",
      items: {
        type: "string",
        enum: ["kafka", "amqp", "websocket", "http"],
      },
    },
    "security-schemes": {
      type: "object",
      nullable: true,
      description: "Security scheme definitions to include",
      additionalProperties: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["oauth2", "apiKey", "httpApiKey", "http", "plain", "scram-sha-256", "scram-sha-512", "gssapi"],
          },
          description: { type: "string", nullable: true },
          name: { type: "string", nullable: true },
          in: { 
            type: "string", 
            nullable: true,
            enum: ["user", "password", "query", "header", "cookie"]
          },
          scheme: { type: "string", nullable: true },
          bearerFormat: { type: "string", nullable: true },
          flows: {
            type: "object",
            nullable: true,
            properties: {
              implicit: { type: "object", nullable: true, additionalProperties: true },
              password: { type: "object", nullable: true, additionalProperties: true },
              clientCredentials: { type: "object", nullable: true, additionalProperties: true },
              authorizationCode: { type: "object", nullable: true, additionalProperties: true },
            },
            additionalProperties: false,
          },
        },
        required: ["type"],
        additionalProperties: false,
      },
    },
  },
  required: [],
};

export default AsyncAPIEmitterOptionsSchema;
export type { AsyncAPIEmitterOptions };