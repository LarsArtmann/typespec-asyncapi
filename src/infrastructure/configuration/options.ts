/**
 * AsyncAPI Emitter Options
 *
 * Configuration system for the TypeSpec AsyncAPI emitter.
 * Single source of truth for defaults, validation, and schema.
 */

import type { EmitterOptions } from "./asyncAPIEmitterOptions.js";
import { isSupportedProtocol, PROTOCOL_LIST } from "../../constants/protocols.js";

export type ServerOptions = {
  url?: string;
  protocol?: string;
  description?: string;
};

export const DEFAULT_OPTIONS: Partial<EmitterOptions> = {
  "output-file": "asyncapi",
  version: "3.0.0",
  title: "Generated API",
  description: "API generated from TypeSpec",
  "file-type": "yaml",
  "asyncapi-version": "3.0.0",
  "protocol-bindings": ["http"],
  versioning: { enabled: false, strategy: "semantic" },
  "omit-unreachable-types": false,
  "include-source-info": false,
  "validate-spec": true,
};

export const DEFAULT_SERVER_OPTIONS: Partial<ServerOptions> = {
  protocol: "http",
  description: "Default server",
};

const SCHEMA_PROPERTIES = {
  "output-file": {
    type: "string",
    description: "Output file name without extension",
    default: "asyncapi",
    nullable: true,
  },
  "file-type": {
    type: "string",
    enum: ["yaml", "json"],
    description: "Output file format",
    default: "yaml",
    nullable: false,
  },
  "asyncapi-version": {
    type: "string",
    enum: ["3.0.0"],
    description: "AsyncAPI version",
    default: "3.0.0",
    nullable: false,
  },
  "protocol-bindings": {
    type: "array",
    description: "Protocol bindings configuration",
    items: { type: "string", enum: [...PROTOCOL_LIST] },
    default: ["http"],
    minItems: 1,
    maxItems: 10,
    uniqueItems: true,
    nullable: false,
  },
  versioning: {
    type: "object",
    additionalProperties: false,
    description: "Versioning configuration",
    properties: {
      enabled: {
        type: "boolean",
        default: false,
        description: "Enable versioning support",
        nullable: true,
      },
      strategy: {
        type: "string",
        enum: ["semantic", "timestamp", "custom"],
        default: "semantic",
        description: "Versioning strategy",
        nullable: false,
      },
    },
    required: ["enabled"],
    nullable: true,
  },
  "security-schemes": {
    type: "array",
    description: "Security scheme configurations",
    items: {
      type: "string",
      enum: ["apiKey", "http", "oauth2", "openIdConnect"],
    },
    default: [],
    uniqueItems: true,
    nullable: true,
  },
} as const;

export const ASYNC_API_EMITTER_OPTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  $defs: {
    AsyncAPIEmitterOptions: {
      type: "object",
      additionalProperties: false,
      properties: SCHEMA_PROPERTIES,
      required: ["asyncapi-version"],
    },
  },
  $ref: "#/$defs/AsyncAPIEmitterOptions",
  properties: SCHEMA_PROPERTIES,
  required: ["asyncapi-version"],
} as const;

export function createAsyncAPIEmitterOptions(
  options?: Partial<EmitterOptions>,
): Required<EmitterOptions> {
  return { ...DEFAULT_OPTIONS, ...options } as Required<EmitterOptions>;
}

export function mergeWithDefaults(options?: Partial<EmitterOptions>): Required<EmitterOptions> {
  return createAsyncAPIEmitterOptions(options);
}

export type { EmitterOptions as AsyncAPIEmitterOptions } from "./asyncAPIEmitterOptions.js";

export function parseAsyncAPIEmitterOptions(options: unknown): EmitterOptions {
  if (!options || typeof options !== "object") {
    throw new Error(
      `Schema validation failed: Invalid AsyncAPI emitter options - ${JSON.stringify(options)}`,
    );
  }

  const opts = options as Record<string, unknown>;
  if (typeof opts["output-file"] === "string") {
    const supportedTemplates = ["cwd", "project-root", "output-dir", "cmd", "emitter-name"];
    const templateMatches = opts["output-file"].match(/\{([^}]+)\}/g);
    if (templateMatches) {
      for (const match of templateMatches) {
        const varName = match.slice(1, -1);
        if (!supportedTemplates.includes(varName)) {
          throw new Error(
            `Invalid path template variable: {${varName}} is not supported. Supported variables: ${supportedTemplates.join(", ")}`,
          );
        }
      }
    }
  }

  if (!isAsyncAPIEmitterOptions(options)) {
    throw new Error(
      `Schema validation failed: Invalid AsyncAPI emitter options - ${JSON.stringify(options)}`,
    );
  }
  return options;
}

export function isAsyncAPIEmitterOptions(options: unknown): options is EmitterOptions {
  if (!options || typeof options !== "object") return false;
  const opts = options as Record<string, unknown>;

  if ("file-type" in opts && opts["file-type"] !== undefined) {
    if (opts["file-type"] !== "yaml" && opts["file-type"] !== "json") return false;
  }

  if ("output-file" in opts && typeof opts["output-file"] === "string") {
    const supportedTemplates = ["cwd", "project-root", "output-dir", "cmd", "emitter-name"];
    const templateMatches = opts["output-file"].match(/\{([^}]+)\}/g);
    if (templateMatches) {
      for (const match of templateMatches) {
        if (!supportedTemplates.includes(match.slice(1, -1))) return false;
      }
    }
  }

  if ("asyncapi-version" in opts && opts["asyncapi-version"] !== undefined) {
    if (typeof opts["asyncapi-version"] !== "string" || opts["asyncapi-version"] !== "3.0.0")
      return false;
  }

  if ("protocol-bindings" in opts && opts["protocol-bindings"] !== undefined) {
    const bindings = opts["protocol-bindings"];
    if (!Array.isArray(bindings)) return false;
    for (const protocol of bindings) {
      if (typeof protocol !== "string" || !isSupportedProtocol(protocol)) return false;
    }
  }

  if ("security-schemes" in opts && opts["security-schemes"] !== undefined) {
    const schemes = opts["security-schemes"];
    if (typeof schemes !== "object" || schemes === null || Array.isArray(schemes)) return false;
    const validSecurityTypes = [
      "userPassword",
      "apiKey",
      "X509",
      "symmetricEncryption",
      "asymmetricEncryption",
      "httpApiKey",
      "http",
      "oauth2",
      "openIdConnect",
      "plain",
      "scramSha256",
      "scramSha512",
      "gssapi",
    ];
    for (const [, scheme] of Object.entries(schemes as Record<string, unknown>)) {
      if (typeof scheme !== "object" || scheme === null) return false;
      const schemeObj = scheme as Record<string, unknown>;
      if (
        !("type" in schemeObj) ||
        typeof schemeObj.type !== "string" ||
        !validSecurityTypes.includes(schemeObj.type)
      )
        return false;
    }
  }

  if (
    "versioning" in opts &&
    opts["versioning"] !== undefined &&
    typeof opts["versioning"] === "object"
  ) {
    const versioningObj = opts["versioning"] as Record<string, unknown>;
    if ("file-naming" in versioningObj && versioningObj["file-naming"] !== undefined) {
      const validFileNamings = ["suffix", "prefix", "directory"];
      if (
        typeof versioningObj["file-naming"] !== "string" ||
        !validFileNamings.includes(versioningObj["file-naming"])
      )
        return false;
    }
  }

  return true;
}

export function validateAsyncAPIEmitterOptions(options: unknown): EmitterOptions {
  return parseAsyncAPIEmitterOptions(options);
}
