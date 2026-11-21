import { printIdentifier } from "@typespec/compiler";
import { fail } from "./diagnostics.js";
import { isRecord } from "./input.js";

const typeNames = new Set([
  "TypeSpec",
  "Array",
  "Record",
  "string",
  "boolean",
  "integer",
  "numeric",
]);

export function literal(value: string): string {
  const escaped = value.replaceAll(/[\\"\n\r\t$]/gu, (char, offset: number) => {
    if (char === "$") {
      return value[offset + 1] === "{" ? String.raw`\$` : "$";
    }
    return JSON.stringify(char).slice(1, -1);
  });
  return `"${escaped}"`;
}

export function checkKey(key: string, at: string): void {
  if (!key || Object.hasOwn(Object.prototype, key)) {
    fail(at, "This key cannot be emitted safely.");
  }
}

export function tspValue(value: unknown, at: string): string {
  if (typeof value === "string") {
    return literal(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean" || value === null) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `#[${value.map((item) => tspValue(item, at)).join(", ")}]`;
  }
  if (isRecord(value)) {
    const fields = Object.entries(value).map(
      ([key, item]) =>
        `${printIdentifier(key, "disallow-reserved")}: ${tspValue(item, at)}`,
    );
    return `#{${fields.join(", ")}}`;
  }
  return fail(at, "Expected a JSON value.");
}

export class Names {
  private readonly used = new Set<string>();

  allocate(preferred: string, fallback: string): string {
    const normalized = preferred.replaceAll(/[^A-Za-z0-9_]/gu, "_");
    const base = /^[A-Za-z]/u.test(normalized)
      ? normalized
      : `${fallback}_${normalized}`;
    // Disallow names that could shadow the schema adapter's emitted primitives or templates.
    const baseName =
      !typeNames.has(base) &&
      printIdentifier(base, "disallow-reserved") === base
        ? base
        : `${fallback}_${base}`;
    let name = baseName;
    for (let suffix = 2; this.used.has(name); suffix++) {
      name = `${baseName}_${String(suffix)}`;
    }
    this.used.add(name);
    return name;
  }
}
