import type { EmitEntity } from "@typespec/asset-emitter";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";

export function extractValue(
  entity: EmitEntity<JsonSchema> | undefined,
): JsonSchema {
  if (!entity) {
    return {};
  }
  switch (entity.kind) {
    case "declaration":
    case "code": {
      const v = entity.value;
      if (!v || typeof v !== "object") {
        return {};
      }
      if (typeof (v as { onValue?: unknown }).onValue === "function") {
        return {};
      }
      return v as JsonSchema;
    }
    default: {
      return {};
    }
  }
}
