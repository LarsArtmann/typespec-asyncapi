import { parseDocument } from "yaml";
import { escapePointerToken } from "../domain/json-pointer.js";
import { fail, type ImportWarning } from "./diagnostics.js";

export type RecordValue = Record<string, unknown>;

export function child(pointer: string, key: string): string {
  return `${pointer}/${escapePointerToken(key)}`;
}

export function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function object(value: unknown, pointer: string): RecordValue {
  if (!isRecord(value)) {
    fail(pointer, "Expected an object.");
  }
  return value;
}

export function entries(value: unknown, pointer: string): [string, unknown][] {
  return value === undefined ? [] : Object.entries(object(value, pointer));
}

export function text(value: unknown, pointer: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(pointer, "Expected a non-empty string.");
  }
  return value;
}

function decodeRef(ref: string, pointer: string): string[] {
  if (!ref.startsWith("#")) {
    fail(pointer, "External references are not supported.");
  }
  let fragment: string;
  try {
    fragment = decodeURIComponent(ref.slice(1));
  } catch {
    fail(pointer, "Malformed percent encoding in reference.");
  }
  if (fragment === "") {
    return [];
  }
  if (!fragment.startsWith("/")) {
    fail(pointer, "Expected a JSON Pointer fragment.");
  }
  return fragment
    .slice(1)
    .split("/")
    .map((token) => {
      if (/~(?![01])/u.test(token)) {
        fail(pointer, "Invalid JSON Pointer escape.");
      }
      return token.replaceAll("~1", "/").replaceAll("~0", "~");
    });
}

export class ImportDocument {
  readonly root: RecordValue;
  readonly warnings: ImportWarning[] = [];

  constructor(source: string) {
    const yaml = parseDocument(source, { version: "1.2", stringKeys: true });
    const yamlIssue = yaml.errors[0] ?? yaml.warnings[0];
    if (yamlIssue) {
      fail("", yamlIssue.message);
    }
    let data: unknown;
    try {
      data = yaml.toJS({ maxAliasCount: 0 });
    } catch (error) {
      fail("", error instanceof Error ? error.message : String(error));
    }
    this.root = object(data, "");
    if (
      typeof this.root.asyncapi !== "string" ||
      !/^3\.1\.\d+$/u.test(this.root.asyncapi)
    ) {
      fail("/asyncapi", "Only AsyncAPI 3.1 documents are supported.");
    }
    if (this.root.asyncapi !== "3.1.0") {
      this.warn(
        "/asyncapi",
        "The emitter writes AsyncAPI 3.1.0.",
        "normalized-value",
      );
    }
  }

  lookup(ref: unknown, at: string): { value: unknown; pointer: string } {
    const tokens = decodeRef(text(ref, at), at);
    let value: unknown = this.root;
    let pointer = "";
    for (const token of tokens) {
      pointer = child(pointer, token);
      if (
        typeof value !== "object" ||
        value === null ||
        (Array.isArray(value) && !/^(?:0|[1-9]\d*)$/u.test(token)) ||
        !Object.hasOwn(value, token)
      ) {
        fail(at, `Unresolved reference to ${pointer}.`);
      }
      value = Reflect.get(value, token);
    }
    return { value, pointer };
  }

  resolve(input: unknown, at: string): { value: RecordValue; pointer: string } {
    let value = object(input, at);
    let pointer = at;
    const seen = new Set([at]);
    while (Object.hasOwn(value, "$ref")) {
      const target = this.lookup(value.$ref, child(pointer, "$ref"));
      if (seen.has(target.pointer)) {
        fail(at, "Circular object reference.");
      }
      seen.add(target.pointer);
      ({ pointer } = target);
      value = object(target.value, pointer);
    }
    return { value, pointer };
  }

  fields(value: RecordValue, at: string, supported: readonly string[]): void {
    for (const key of Object.keys(value)) {
      if (!supported.includes(key)) {
        this.warn(child(at, key), "Field is not imported.");
      }
    }
  }

  warn(
    pointer: string,
    message: string,
    code: ImportWarning["code"] = "unsupported-field",
  ): void {
    this.warnings.push({ code, pointer, message });
  }
}
