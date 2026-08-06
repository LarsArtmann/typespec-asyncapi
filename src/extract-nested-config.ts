/**
 * Recursively extract values from a Model-shaped configuration.
 *
 * Used for nested objects inside value-literal `@decorator(#{...})` configs
 * (e.g., `variables` and `security` inside `@server`). TypeSpec represents
 * each nested object as a Model instance with a `.properties` Map; strings,
 * numbers, and booleans expose `.value`; tuples expose `.values`.
 */
export function extractNestedConfig(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }
  const v = value as {
    kind?: string;
    properties?: Map<string, { type: unknown }>;
    value?: unknown;
    values?: unknown[];
  };
  if (v.kind === "String" || v.kind === "Number" || v.kind === "Boolean") {
    return v.value;
  }
  if (v.kind === "Model" && v.properties) {
    const out: Record<string, unknown> = {};
    for (const [name, prop] of v.properties) {
      out[name] = extractNestedConfig(prop.type);
    }
    return out;
  }
  if (v.kind === "Tuple" && Array.isArray(v.values)) {
    return v.values.map((item) => extractNestedConfig(item));
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractNestedConfig(item));
  }
  return value;
}
