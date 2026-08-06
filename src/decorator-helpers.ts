/**
 * Helper functions for decorators: diagnostic reporting and model property extraction.
 */

import type {
  DecoratorContext,
  DiagnosticTarget,
  Model,
} from "@typespec/compiler";
import { $lib } from "./lib.js";
import { PROTOCOL_LIST } from "./constants/protocols.js";
import type { Tag } from "./domain/models/asyncapi-document.js";

// === DIAGNOSTIC HELPERS ===

/**
 * Report a decorator diagnostic using the library's registered diagnostic codes.
 * The code must be declared in $lib.diagnostics (src/lib.ts) — TypeScript enforces this at compile time.
 * The library name is auto-prefixed to the code by the TypeSpec runtime.
 */
export const reportDiagnostic = (
  context: DecoratorContext,
  code: keyof typeof $lib.diagnostics,
  target: unknown,
  format?: Record<string, unknown>,
  messageId?: string,
): void => {
  $lib.reportDiagnostic(context.program, {
    code,
    format,
    messageId: messageId as "default",
    target: target as DiagnosticTarget,
  });
};

/** Shared diagnostic context shape for validate* guards. */
export interface DiagnosticContext {
  context: DecoratorContext;
  target: unknown;
  diagnosticCode: keyof typeof $lib.diagnostics;
  format?: Record<string, unknown>;
}

/** Validate that a value is a non-empty string; if not, report and return false. */
export const validateNonEmptyString = (
  value: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: keyof typeof $lib.diagnostics,
  format?: Record<string, unknown>,
): value is string =>
  typeof value === "string" && value.length > 0
    ? true
    : (reportDiagnostic(context, diagnosticCode, target, format), false);

/** Validate that a config value is present; if not, report and return false. */
export const validateConfig = (
  config: unknown,
  ctx: DiagnosticContext,
): boolean =>
  config
    ? true
    : (reportDiagnostic(
        ctx.context,
        ctx.diagnosticCode,
        ctx.target,
        ctx.format,
      ),
      false);

/** Report a `unsupported-protocol` diagnostic. Shared by all protocol-accepting decorators. */
export const reportUnsupportedProtocol = (
  context: DecoratorContext,
  target: unknown,
  protocol: string,
): void => {
  reportDiagnostic(context, "unsupported-protocol", target, {
    protocol,
    validProtocols: PROTOCOL_LIST.join(", "),
  });
};

/**
 * Higher-order decorator factory: validate config presence, then if valid, invoke `run`.
 * Returns `true` if validation passed (and `run` ran), `false` if validation failed.
 *
 * Used by `@protocol`, `@security`, `@message`, and `@bindings` to eliminate
 * the repeated `validateConfig → ... → storeXxx` boilerplate.
 */
export function validatedDecorator(
  context: DecoratorContext,
  target: unknown,
  config: unknown,
  options: {
    code: keyof typeof $lib.diagnostics;
    format?: Record<string, unknown>;
    run: () => void;
  },
): boolean {
  if (
    !validateConfig(config, {
      context,
      target,
      diagnosticCode: options.code,
      format: options.format,
    })
  ) {
    return false;
  }
  options.run();
  return true;
}

/**
 * Validate a non-empty `name` argument, then if valid invoke `onValid(name)`.
 *
 * This consolidates the validate-name-then-act pattern shared by all
 * reusable-component decorators (`@use*`, `@operationTrait`, etc.).
 */
export function validateNameAndRun(opts: {
  context: DecoratorContext;
  target: unknown;
  name: unknown;
  code: keyof typeof $lib.diagnostics;
  formatKey: string;
  onValid: (name: string) => void;
}): void {
  if (
    !validateNonEmptyString(opts.name, opts.context, opts.target, opts.code, {
      [opts.formatKey]: String(opts.name),
    })
  ) {
    return;
  }
  opts.onValid(opts.name);
}

// === URL VALIDATION ===

/**
 * Validate a server URL for obvious malformation.
 *
 * AsyncAPI server URLs are host/path strings, NOT full RFC 3986 URLs —
 * the protocol is specified separately via the `protocol` field.
 * Template variables like `{host}` are valid AsyncAPI patterns.
 *
 * Returns false only for clearly broken values:
 * - Empty or whitespace-only strings
 * - Strings containing spaces or control characters
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (/\s/u.test(trimmed)) {
    return false;
  }
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.codePointAt(i);
    if (code === undefined) {
      return false;
    }
    if (code < 32 || code === 127) {
      return false;
    }
  }
  return true;
}

// === MODEL HELPERS ===

export function getModelPropertyStringValue(
  model: Model,
  propertyName: string,
): string | undefined {
  return readModelProperty(model, propertyName) as string | undefined;
}

export function getModelPropertyValue(
  model: Model,
  propertyName: string,
): unknown {
  return readModelProperty(model, propertyName);
}

/** Read a `Model` property's underlying value if it exists, else `undefined`. */
function readModelProperty(model: Model, propertyName: string): unknown {
  const property = model.properties.get(propertyName);
  if (!property) {
    return undefined;
  }
  const type = property.type as { kind: string; value?: unknown };
  return type.kind === "String" && type.value !== undefined ? type.value : type;
}

export function modelToRecord(model: Model): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, prop] of model.properties) {
    const propType = prop.type as { kind: string; value?: unknown };
    record[key] = propType.kind === "String" ? propType.value : propType;
  }
  return record;
}

export function extractConfigRecord(config: unknown): Record<string, unknown> {
  if (isModelConfig(config)) {
    return modelToRecord(config);
  }
  return config as Record<string, unknown>;
}

/**
 * Type guard: check if an unknown decorator argument is a TypeSpec `Model`
 * expression (model-expression syntax `{}` passed to a decorator).
 */
export function isModelConfig(config: unknown): config is Model {
  return (
    config !== null &&
    config !== undefined &&
    typeof config === "object" &&
    "kind" in config &&
    config.kind === "Model"
  );
}

/**
 * Normalize a single tag item (string or tag object) into a `Tag`.
 * Returns `null` if the item is neither a valid string nor a tag object with a `name` field.
 */
export function normalizeTagItem(item: unknown): Tag | null {
  if (typeof item === "string") {
    return item.length > 0 ? { name: item } : null;
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.length > 0) {
      const tag: Tag = { name: obj.name };
      if (typeof obj.description === "string") {
        tag.description = obj.description;
      }
      const extDocs = obj.externalDocs;
      if (extDocs && typeof extDocs === "object") {
        const ed = extDocs as Record<string, unknown>;
        if (typeof ed.url === "string") {
          tag.externalDocs = {
            url: ed.url,
            ...(typeof ed.description === "string"
              ? { description: ed.description }
              : {}),
          };
        }
      }
      return tag;
    }
  }
  return null;
}

/**
 * Extract message configuration from `@message` config: title, description,
 * contentType, schemaFormat, and examples. Supports both model-expression and
 * value-literal config shapes.
 */
export function extractMessageConfig(
  config: unknown,
  target: Model,
): {
  title: string;
  description: string;
  contentType: string;
  schemaFormat?: string;
  examples?: {
    name?: string;
    summary?: string;
    headers?: unknown;
    payload?: unknown;
  }[];
} {
  process.stderr.write(`DEBUG extractMessageConfig isModelConfig=${isModelConfig(config)}\n`);
  let title: string | undefined;
  let description: string | undefined;
  let contentType: string | undefined;
  let schemaFormat: string | undefined;
  let examples:
    | {
        name?: string;
        summary?: string;
        headers?: unknown;
        payload?: unknown;
      }[]
    | undefined;

  if (isModelConfig(config)) {
    title = getModelPropertyStringValue(config, "title");
    description = getModelPropertyStringValue(config, "description");
    contentType = getModelPropertyStringValue(config, "contentType");
    schemaFormat = getModelPropertyStringValue(config, "schemaFormat");
  } else if (config && typeof config === "object") {
    const configObj = config as Record<string, unknown>;
    process.stderr.write(`DEBUG extractMessageConfig configObj=${JSON.stringify(configObj)}\n`);
    title = typeof configObj.title === "string" ? configObj.title : undefined;
    description =
      typeof configObj.description === "string" ? configObj.description : undefined;
    contentType =
      typeof configObj.contentType === "string" ? configObj.contentType : undefined;
    schemaFormat =
      typeof configObj.schemaFormat === "string" ? configObj.schemaFormat : undefined;
    if (Array.isArray(configObj.examples)) {
      examples = configObj.examples as typeof examples;
    }
  }

  const result = {
    contentType: contentType ?? "application/json",
    description: description ?? `Message ${target.name}`,
    title: title ?? target.name,
    ...(schemaFormat ? { schemaFormat } : {}),
    ...(examples ? { examples } : {}),
  };
  process.stderr.write(
    `DEBUG extractMessageConfig result=${JSON.stringify(result)}\n`,
  );
  return result;
}
