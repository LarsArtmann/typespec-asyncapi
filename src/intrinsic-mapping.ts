/**
 * Scalar type name to JSON Schema type mapping.
 */

import type { SchemaObject } from "./domain/models/asyncapi-document.js";

export function intrinsicToSchema(typeName: string): SchemaObject {
  switch (typeName) {
    case "string":
      return { type: "string" };
    case "int8":
    case "int16":
    case "int32":
    case "integer":
      return {
        type: "integer",
        format: typeName === "integer" ? undefined : typeName,
      };
    case "int64":
      return { type: "integer", format: "int64" };
    case "uint8":
      return { type: "integer", format: "uint8" };
    case "uint16":
      return { type: "integer", format: "uint16" };
    case "uint32":
      return { type: "integer", format: "uint32" };
    case "uint64":
      return { type: "integer", format: "uint64" };
    case "safeint":
      return { type: "integer", format: "safeint" };
    case "float":
    case "float32":
      return { type: "number", format: "float" };
    case "float64":
      return { type: "number", format: "double" };
    case "numeric":
      return { type: "number" };
    case "decimal":
    case "decimal128":
      return { type: "string", format: "decimal" };
    case "boolean":
      return { type: "boolean" };
    case "utcDateTime":
    case "offsetDateTime":
      return { type: "string", format: "date-time" };
    case "unixTimestamp32":
      return { type: "integer", format: "unix-timestamp" };
    case "plainDate":
      return { type: "string", format: "date" };
    case "plainTime":
      return { type: "string", format: "time" };
    case "duration":
      return { type: "string", format: "duration" };
    case "bytes":
      return { type: "string", format: "byte" };
    case "url":
      return { type: "string", format: "uri" };
    default:
      return { type: "string" };
  }
}
