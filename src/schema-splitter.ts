/**
 * Schema Splitter
 *
 * Splits an AsyncAPI document's schemas into individual files and rewrites
 * all $ref pointers to use external file references.
 *
 * After splitting:
 * - Main document has schemas removed from components.schemas
 * - Each schema written to schemas/{name}.{ext}
 * - All $ref values rewritten from #/components/schemas/Name to schemas/Name.{ext}
 */

import type { AsyncAPIDocument, SchemaObject } from "./domain/models/asyncapi-document.js";

const SCHEMA_REF_PREFIX = "#/components/schemas/";

export interface SplitResult {
  mainDocument: AsyncAPIDocument;
  schemaFiles: Map<string, SchemaObject>;
}

export function splitSchemas(
  doc: AsyncAPIDocument,
  fileExtension: string,
): SplitResult {
  const schemas = doc.components?.schemas;
  if (!schemas) {
    return { mainDocument: doc, schemaFiles: new Map() };
  }

  const schemaFiles = new Map<string, SchemaObject>();
  const cloned = structuredClone(doc) as AsyncAPIDocument;

  for (const [name, schema] of Object.entries(schemas)) {
    schemaFiles.set(`${name}.${fileExtension}`, schema);
  }

  if (cloned.components) {
    delete cloned.components.schemas;
    if (
      !cloned.components.messages &&
      !cloned.components.securitySchemes &&
      !cloned.components.schemas
    ) {
      delete cloned.components;
    }
  }

  rewriteRefs(cloned, fileExtension);

  return { mainDocument: cloned, schemaFiles };
}

function rewriteRefs(obj: unknown, ext: string): void {
  if (!obj || typeof obj !== "object") {
    return;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      rewriteRefs(item, ext);
    }
    return;
  }

  const record = obj as Record<string, unknown>;

  if (typeof record.$ref === "string") {
    if (record.$ref.startsWith(SCHEMA_REF_PREFIX)) {
      const schemaName = record.$ref.slice(SCHEMA_REF_PREFIX.length);
      record.$ref = `schemas/${schemaName}.${ext}`;
    }
    return;
  }

  for (const value of Object.values(record)) {
    rewriteRefs(value, ext);
  }
}
