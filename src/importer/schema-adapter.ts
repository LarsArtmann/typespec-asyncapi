import type {
  convertOpenAPI3Document as schemaConverter,
  OpenAPISchema3_1,
} from "@typespec/openapi3";
import { fail } from "./diagnostics.js";
import {
  extractSchemaDeclarations,
  type SchemaAnnotations,
} from "./schema-source.js";
import {
  entries,
  child,
  isRecord,
  object,
  type ImportDocument,
  type RecordValue,
} from "./input.js";
import { literal, type Names, tspValue } from "./source.js";

interface SchemaEntry extends SchemaAnnotations {
  name: string;
  schema: OpenAPISchema3_1;
}

interface AnnotationSite {
  entry: SchemaEntry;
  member: string;
}

const structural = [
  "type",
  "properties",
  "required",
  "items",
  "additionalProperties",
] as const;
const keywords = new Set([
  "const",
  "enum",
  "format",
  "default",
  "examples",
  "deprecated",
  "readOnly",
  "writeOnly",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
]);
const types = [
  "string",
  "boolean",
  "integer",
  "number",
  "array",
  "object",
  "null",
] as const;
type ProjectedSchema = OpenAPISchema3_1 | { $ref: string };

async function loadSchemaConverter(): Promise<typeof schemaConverter> {
  try {
    import.meta.resolve("@typespec/openapi3");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ERR_MODULE_NOT_FOUND"
    ) {
      throw new Error(
        "Schema import requires @typespec/openapi3. Install it with `pnpm add -D @typespec/openapi3@^1.17.0` and retry.",
        { cause: error },
      );
    }
    throw error;
  }
  const { convertOpenAPI3Document } = await import("@typespec/openapi3");
  return convertOpenAPI3Document;
}

/** Reuse the public document converter for TypeSpec type syntax, not OpenAPI metadata. */
export class SchemaAdapter {
  private readonly schemas = new Map<string, SchemaEntry>();
  private readonly doc: ImportDocument;
  private readonly names: Names;

  constructor(doc: ImportDocument, names: Names) {
    this.doc = doc;
    this.names = names;
  }

  addComponent(key: string, input: unknown): void {
    const at = child("/components/schemas", key);
    const name = this.add(input, at, key);
    if (name !== key) {
      this.doc.warn(
        at,
        `Schema component is emitted as '${name}'.`,
        "normalized-value",
      );
    }
  }

  add(
    input: unknown,
    at: string,
    preferred: string,
    messageDecorators?: string[],
  ): string {
    const { value, pointer } = this.doc.resolve(input, at);
    if (messageDecorators && value.type !== "object") {
      fail(at, "Messages must have a named or inline JSON object payload.");
    }

    let entry = this.schemas.get(pointer);
    if (!entry) {
      const key =
        pointer === at
          ? preferred
          : (pointer
              .split("/")
              .at(-1)
              ?.replaceAll("~1", "/")
              .replaceAll("~0", "~") ?? preferred);
      entry = {
        name: this.names.allocate(key, "Schema"),
        schema: {},
        annotations: new Map(),
      };
      this.schemas.set(pointer, entry);
      if (typeof value.type !== "string" || value.type === "null") {
        fail(
          pointer,
          "A named schema requires a supported, explicit non-null type.",
        );
      }
      const schema = this.project(value, pointer, { entry, member: "" });
      if ("$ref" in schema) {
        fail(pointer, "Expected a concrete named schema.");
      }
      entry.schema = schema;
    }
    if (messageDecorators) {
      if (entry.messageDecorators) {
        fail(
          at,
          "Multiple messages sharing one payload model are not supported.",
        );
      }
      entry.messageDecorators = messageDecorators;
    }
    return entry.name;
  }

  private project(
    input: unknown,
    at: string,
    site?: AnnotationSite,
  ): ProjectedSchema {
    if (input === true) {
      return {};
    }
    if (input === false) {
      fail(at, "Boolean false schemas are not supported.");
    }
    const value = object(input, at);
    if (Object.hasOwn(value, "$ref")) {
      this.doc.fields(value, at, ["$ref"]);
      return { $ref: `#/components/schemas/${this.add(value, at, "Schema")}` };
    }
    if (
      Object.hasOwn(value, "schemaFormat") ||
      Object.hasOwn(value, "schema")
    ) {
      fail(at, "Multi Format Schema Objects are not supported.");
    }
    const type = types.find((candidate) => candidate === value.type);
    if (
      Array.isArray(value.type) &&
      value.type.length === 2 &&
      value.type.includes("null")
    ) {
      const primitive = types.find(
        (candidate) =>
          candidate !== "null" &&
          candidate !== "array" &&
          candidate !== "object" &&
          Array.isArray(value.type) &&
          value.type.includes(candidate),
      );
      if (primitive) {
        this.annotate(value, at, site);
        return { type: [primitive, "null"] };
      }
    }
    if (value.type !== undefined && type === undefined) {
      fail(child(at, "type"), "Expected a supported JSON Schema type.");
    }
    this.annotate(value, at, site);
    if (type === "object") {
      return this.projectObject(at, value, site);
    }
    if (type === "array") {
      if (Array.isArray(value.items)) {
        fail(child(at, "items"), "Tuple schemas are not supported.");
      }
      return {
        type,
        ...(value.items === undefined
          ? {}
          : {
              items: this.project(value.items, child(at, "items")),
            }),
      };
    }
    return type === undefined ? {} : { type };
  }

  private projectObject(
    at: string,
    value: RecordValue,
    site: AnnotationSite | undefined,
  ): OpenAPISchema3_1 {
    const propsAt = child(at, "properties");
    const properties = Object.fromEntries(
      entries(value.properties, propsAt).map(([key, schema]) => {
        const path = child(propsAt, key);
        if (key === "__proto__") {
          fail(path, "This property name cannot be emitted safely.");
        }
        return [
          key,
          this.project(
            schema,
            path,
            site?.member === ""
              ? { entry: site.entry, member: child("", key) }
              : undefined,
          ),
        ];
      }),
    );
    const required = value.required ?? [];
    if (
      !Array.isArray(required) ||
      !required.every(
        (key): key is string =>
          typeof key === "string" && Object.hasOwn(properties, key),
      )
    ) {
      fail(
        child(at, "required"),
        "Required fields must name declared properties.",
      );
    }
    const additional = value.additionalProperties;
    const additionalAt = child(at, "additionalProperties");
    if (
      additional !== undefined &&
      typeof additional !== "boolean" &&
      !isRecord(additional)
    ) {
      fail(additionalAt, "Expected a boolean or schema object.");
    }
    return {
      type: "object",
      properties,
      required,
      ...(isRecord(additional)
        ? {
            additionalProperties: this.project(additional, additionalAt),
          }
        : {}),
    };
  }

  private annotate(
    value: RecordValue,
    at: string,
    site: AnnotationSite | undefined,
  ): void {
    const decorators: string[] = [];
    for (const [key, item] of Object.entries(value)) {
      const pointer = child(at, key);
      if (
        key === "properties" ||
        key === "required" ||
        key === "additionalProperties"
      ) {
        if (value.type !== "object") {
          this.doc.warn(
            pointer,
            "Object keyword on a non-object schema is not imported.",
          );
        }
        if (
          key !== "additionalProperties" ||
          item !== false ||
          value.type !== "object"
        ) {
          continue;
        }
      } else if (structural.some((field) => field === key)) {
        if (key === "items" && value.type !== "array") {
          this.doc.warn(
            pointer,
            "Items without an array type are not imported.",
          );
        }
        continue;
      }
      if (!site) {
        this.doc.warn(pointer, "Keyword on a nested schema is not imported.");
      } else if (key === "description" && typeof item === "string") {
        decorators.push(`@doc(${literal(item)})`);
      } else if (key === "title" && typeof item === "string") {
        decorators.push(`@summary(${literal(item)})`);
      } else if (
        keywords.has(key) ||
        key === "additionalProperties" ||
        /^x-[\w.-]+$/u.test(key)
      ) {
        decorators.push(
          `@jsonSchemaExtension(${literal(key)}, ${tspValue(item, pointer)})`,
        );
      } else {
        this.doc.warn(pointer, "Schema keyword is not imported.");
      }
    }
    if (site && decorators.length > 0) {
      site.entry.annotations.set(site.member, decorators);
    }
  }

  async render(): Promise<string[]> {
    if (this.schemas.size === 0) {
      return [];
    }
    const convertOpenAPI3Document = await loadSchemaConverter();
    const byName = new Map(
      [...this.schemas.values()].map((entry) => [entry.name, entry]),
    );
    const content = await convertOpenAPI3Document(
      {
        openapi: "3.1.0",
        info: { title: "SchemaAdapter", version: "1" },
        paths: {},
        components: {
          schemas: Object.fromEntries(
            [...byName].map(([name, entry]) => [name, entry.schema]),
          ),
        },
      },
      { disableExternalRefs: true },
    );

    return extractSchemaDeclarations(content, byName);
  }
}
