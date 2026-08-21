/**
 * Test utilities for resolving and collecting JSON Pointer `$ref` values.
 *
 * Implements RFC 6901 pointer resolution (including `~1` → `/` and
 * `~0` → `~` unescaping) so ref-chain tests do not silently pass on
 * escaped tokens.
 */

/** Resolve a JSON Pointer `$ref` against a document. Returns the target or null. */
export function resolveRef(doc: unknown, ref: string): unknown | null {
  if (!ref.startsWith("#/")) {
    return null;
  }
  const parts = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return null;
    }
    const decoded = part.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[decoded];
  }
  return current;
}

/** Recursively collect every `$ref` string in an object tree. */
export function collectRefs(obj: unknown): string[] {
  const refs: string[] = [];

  function walk(node: unknown): void {
    if (node == null || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.$ref === "string") {
      refs.push(record.$ref);
    }
    for (const value of Object.values(record)) {
      walk(value);
    }
  }

  walk(obj);
  return refs;
}
