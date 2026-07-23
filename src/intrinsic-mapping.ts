/**
 * Scalar type name to JSON Schema type mapping.
 */

import type { JsonSchema } from "./domain/models/asyncapi-document.js";

export function intrinsicToSchema(typeName: string): JsonSchema {
  switch (typeName) {
    case "string": {
      return { type: "string" };
    }
    case "int8":
    case "int16":
    case "int32":
    case "integer": {
      return {
        format: typeName === "integer" ? undefined : typeName,
        type: "integer",
      };
    }
    case "int64": {
      return { format: "int64", type: "integer" };
    }
    case "uint8": {
      return { format: "uint8", type: "integer" };
    }
    case "uint16": {
      return { format: "uint16", type: "integer" };
    }
    case "uint32": {
      return { format: "uint32", type: "integer" };
    }
    case "uint64": {
      return { format: "uint64", type: "integer" };
    }
    case "safeint": {
      return { format: "safeint", type: "integer" };
    }
    case "float":
    case "float32": {
      return { format: "float", type: "number" };
    }
    case "float64": {
      return { format: "double", type: "number" };
    }
    case "numeric": {
      return { type: "number" };
    }
    case "decimal":
    case "decimal128": {
      return { format: "decimal", type: "string" };
    }
    case "boolean": {
      return { type: "boolean" };
    }
    case "utcDateTime":
    case "offsetDateTime": {
      return { format: "date-time", type: "string" };
    }
    case "unixTimestamp32": {
      return { format: "unix-timestamp", type: "integer" };
    }
    case "plainDate": {
      return { format: "date", type: "string" };
    }
    case "plainTime": {
      return { format: "time", type: "string" };
    }
    case "duration": {
      return { format: "duration", type: "string" };
    }
    case "bytes": {
      return { format: "byte", type: "string" };
    }
    case "url": {
      return { format: "uri", type: "string" };
    }
    default: {
      return { type: "string" };
    }
  }
}
