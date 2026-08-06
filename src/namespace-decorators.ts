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

function namedConfigDecorator(
  code: "invalid-trait-config" | "invalid-parameter-config",
  formatKey: string,
  fields: string[],
  symbol: symbol,
): (context: DecoratorContext, target: Namespace, name: unknown, config: unknown) => void {
  return (context, target, name, config) => {
    const valid = validateNonEmptyString(name, context, target, code, { [formatKey]: String(name) });
    if (!valid) {
      return;
    }
    const cfg = extractConfigRecord(config);
    storeMulti(context.program, symbol, target, { name, ...pickStringFields(cfg, fields) });
  };
}

export const $operationTrait = namedConfigDecorator(
  "invalid-trait-config", "traitName", ["description", "summary", "title"], stateSymbols.operationTraits,
);
export const $messageTrait = namedConfigDecorator(
  "invalid-trait-config", "traitName", ["contentType", "description", "title"], stateSymbols.messageTraits,
);
export const $parameter = namedConfigDecorator(
  "invalid-parameter-config", "parameterName", ["description", "location"], stateSymbols.reusableParameters,
);

export function $reusableCorrelationId(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  location: unknown,
): void {
  const fmt = { modelName: String(name) };
  const ok = validateNonEmptyString(name, context, target, "invalid-correlationId-config", fmt)
    && validateNonEmptyString(location, context, target, "invalid-correlationId-config", fmt);
  if (ok) {
    storeMulti(context.program, stateSymbols.reusableCorrelationIds, target, { location, name });
  }
}

export function $reusableBinding(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  bindingConfig: unknown,
): void {
  const nameOk = validateNonEmptyString(name, context, target, "invalid-bindings-config", { targetKind: target.kind });
  if (!nameOk || !bindingConfig || typeof bindingConfig !== "object") {
    if (nameOk) {
      reportDiagnostic(context, "invalid-bindings-config", target, { targetKind: target.kind });
    }
    return;
  }
  const { bindings } = processBindings(extractConfigRecord(bindingConfig));
  storeMulti(context.program, stateSymbols.reusableBindings, target, { bindings, name });
}
