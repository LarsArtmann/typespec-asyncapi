import type {
  DecoratorContext,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { isSupportedProtocol } from "./constants/protocols.js";
import {
  storeDefaultContentType,
  storeMessageTrait,
  storeOperationTrait,
  storeReusableBinding,
  storeReusableCorrelationId,
  storeReusableParameter,
  storeServerConfig,
} from "./state-writers.js";
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

type StoreFn = (program: DecoratorContext["program"], target: Namespace, data: Record<string, unknown>) => void;

function pickStringFields(cfg: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof cfg[key] === "string") {
      out[key] = cfg[key];
    }
  }
  return out;
}

function makeNamedConfigDecorator(
  diagnosticCode: "invalid-trait-config" | "invalid-parameter-config",
  formatKey: string,
  fields: string[],
  store: StoreFn,
): (context: DecoratorContext, target: Namespace, name: unknown, config: unknown) => void {
  return (context, target, name, config) => {
    const format = { [formatKey]: String(name) };
    if (!validateNonEmptyString(name, context, target, diagnosticCode, format)) {
      return;
    }
    const cfg = extractConfigRecord(config);
    store(context.program, target, { name, ...pickStringFields(cfg, fields) });
  };
}

export const $operationTrait = makeNamedConfigDecorator(
  "invalid-trait-config",
  "traitName",
  ["description", "summary", "title"],
  (program, target, data) => { storeOperationTrait(program, target, data as never); },
);

export const $messageTrait = makeNamedConfigDecorator(
  "invalid-trait-config",
  "traitName",
  ["contentType", "description", "title"],
  (program, target, data) => { storeMessageTrait(program, target, data as never); },
);

export const $parameter = makeNamedConfigDecorator(
  "invalid-parameter-config",
  "parameterName",
  ["description", "location"],
  (program, target, data) => { storeReusableParameter(program, target, data as never); },
);

export function $reusableCorrelationId(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  location: unknown,
): void {
  const format = { modelName: String(name) };
  if (!validateNonEmptyString(name, context, target, "invalid-correlationId-config", format)) {
    return;
  }
  if (!validateNonEmptyString(location, context, target, "invalid-correlationId-config", format)) {
    return;
  }
  storeReusableCorrelationId(context.program, target, { location, name });
}

export function $reusableBinding(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  config: unknown,
): void {
  if (!validateNonEmptyString(name, context, target, "invalid-bindings-config", { targetKind: target.kind })) {
    return;
  }
  if (!config || typeof config !== "object") {
    reportDiagnostic(context, "invalid-bindings-config", target, { targetKind: target.kind });
    return;
  }
  const { bindings } = processBindings(extractConfigRecord(config));
  storeReusableBinding(context.program, target, { bindings, name });
}
