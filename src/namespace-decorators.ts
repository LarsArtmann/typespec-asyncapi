import type { DecoratorContext, Namespace, Operation } from "@typespec/compiler";
import { isSupportedProtocol } from "./constants/protocols.js";
import { storeDefaultContentType, storeMulti, storeServerConfig } from "./state-writers.js";
import { stateSymbols } from "./lib.js";
import {
  extractConfigRecord,
  isValidUrl,
  reportDiagnostic,
  reportUnsupportedProtocol,
  validateConfig,
  validateNonEmptyString,
} from "./decorator-helpers.js";
import { processBindings } from "./validation/binding-validator.js";

export function $server(
  context: DecoratorContext,
  target: Namespace | Operation,
  name: string,
  config: unknown,
): void {
  if (target.kind !== "Namespace") {
    reportDiagnostic(context, "server-target-invalid", target);
    return;
  }

  if (
    !validateConfig(config, {
      context,
      target,
      diagnosticCode: "invalid-server-config",
      format: { serverName: name },
    })
  ) {
    return;
  }

  const configTyped = config as Record<string, unknown>;

  if (!configTyped.url) {
    reportDiagnostic(context, "server-url-required", target);
    return;
  }

  if (!isValidUrl(configTyped.url as string)) {
    reportDiagnostic(context, "invalid-server-url", target, {
      url: configTyped.url,
    });
    return;
  }

  if (!configTyped.protocol) {
    reportDiagnostic(context, "server-protocol-required", target);
    return;
  }

  const protocol = (configTyped.protocol as string).toLowerCase();
  if (!isSupportedProtocol(protocol)) {
    reportUnsupportedProtocol(context, target, protocol);
    return;
  }

  storeServerConfig(context.program, target, { ...configTyped, name });
}

export function $defaultContentType(
  context: DecoratorContext,
  target: Namespace,
  contentType: unknown,
): void {
  if (!contentType || typeof contentType !== "string") {
    return;
  }
  storeDefaultContentType(context.program, target, contentType);
}

// === REUSABLE COMPONENT DEFINITION DECORATORS ===

function pickStringFields(cfg: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof cfg[key] === "string") {
      out[key] = cfg[key];
    }
  }
  return out;
}

const PARAMETER_EXTRA_FIELDS = ["enum", "default", "examples"] as const;
const OPERATION_TRAIT_EXTRA = ["security", "tags", "bindings"] as const;
const MESSAGE_TRAIT_EXTRA = ["summary", "tags", "bindings", "headers", "correlationId"] as const;

function pickDefined(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
}

function namedConfigDecorator(
  code: "invalid-trait-config" | "invalid-parameter-config",
  formatKey: string,
  fields: string[],
  symbol: symbol,
  extraPicker?: (
    cfg: Record<string, unknown>,
    context?: DecoratorContext,
    target?: Namespace,
  ) => Record<string, unknown>,
): (context: DecoratorContext, target: Namespace, name: unknown, config: unknown) => void {
  return (context, target, name, config) => {
    const valid = validateNonEmptyString(name, context, target, code, {
      [formatKey]: String(name),
    });
    if (!valid) {
      return;
    }
    const cfg = extractConfigRecord(config);
    storeMulti(context.program, symbol, target, {
      name,
      ...pickStringFields(cfg, fields),
      ...extraPicker?.(cfg, context, target),
    });
  };
}

export const $operationTrait = namedConfigDecorator(
  "invalid-trait-config",
  "traitName",
  ["description", "summary", "title"],
  stateSymbols.operationTraits,
  (cfg) => pickDefined(cfg, OPERATION_TRAIT_EXTRA),
);
export const $messageTrait = namedConfigDecorator(
  "invalid-trait-config",
  "traitName",
  ["contentType", "description", "title"],
  stateSymbols.messageTraits,
  (cfg) => pickDefined(cfg, MESSAGE_TRAIT_EXTRA),
);
export const $parameter = namedConfigDecorator(
  "invalid-parameter-config",
  "parameterName",
  ["description", "location"],
  stateSymbols.reusableParameters,
  (cfg, context, target) => {
    if (context && target) {
      validateParameterLocation(cfg, context, target);
    }
    return pickDefined(cfg, PARAMETER_EXTRA_FIELDS);
  },
);

/** Warn if `location` is not a valid AsyncAPI runtime expression. */
function validateParameterLocation(
  cfg: Record<string, unknown>,
  context: DecoratorContext,
  target: Namespace,
): void {
  const { location } = cfg;
  if (typeof location !== "string" || location.length === 0) {
    return;
  }
  if (!location.startsWith("$message.") || !location.includes("#")) {
    reportDiagnostic(context, "invalid-parameter-location", target, { location });
  }
}

export function $reusableCorrelationId(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  location: unknown,
): void {
  const fmt = { modelName: String(name) };
  const ok =
    validateNonEmptyString(name, context, target, "invalid-correlationId-config", fmt) &&
    validateNonEmptyString(location, context, target, "invalid-correlationId-config", fmt);
  if (ok) {
    storeMulti(context.program, stateSymbols.reusableCorrelationIds, target, {
      location,
      name,
    });
  }
}

export function $reusableBinding(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  bindingConfig: unknown,
): void {
  const fmt = { targetKind: target.kind };
  const nameOk = validateNonEmptyString(name, context, target, "invalid-bindings-config", fmt);
  if (!nameOk || !bindingConfig || typeof bindingConfig !== "object") {
    if (nameOk) {
      reportDiagnostic(context, "invalid-bindings-config", target, fmt);
    }
    return;
  }
  const { bindings } = processBindings(extractConfigRecord(bindingConfig));
  storeMulti(context.program, stateSymbols.reusableBindings, target, {
    bindings,
    name,
  });
}
