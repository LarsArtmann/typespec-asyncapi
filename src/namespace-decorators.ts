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
import type { ProtocolBindings } from "./domain/models/asyncapi-document.js";

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

export function $operationTrait(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  config: unknown,
): void {
  if (!validateNonEmptyString(name, context, target, "invalid-trait-config", { traitName: String(name) })) {
    return;
  }
  const cfg = extractConfigRecord(config);
  storeOperationTrait(context.program, target, {
    name: name,
    ...(typeof cfg.description === "string" ? { description: cfg.description } : {}),
    ...(typeof cfg.summary === "string" ? { summary: cfg.summary } : {}),
    ...(typeof cfg.title === "string" ? { title: cfg.title } : {}),
  });
}

export function $messageTrait(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  config: unknown,
): void {
  if (!validateNonEmptyString(name, context, target, "invalid-trait-config", { traitName: String(name) })) {
    return;
  }
  const cfg = extractConfigRecord(config);
  storeMessageTrait(context.program, target, {
    name: name,
    ...(typeof cfg.contentType === "string" ? { contentType: cfg.contentType } : {}),
    ...(typeof cfg.description === "string" ? { description: cfg.description } : {}),
    ...(typeof cfg.title === "string" ? { title: cfg.title } : {}),
  });
}

export function $parameter(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  config: unknown,
): void {
  if (!validateNonEmptyString(name, context, target, "invalid-parameter-config", { parameterName: String(name) })) {
    return;
  }
  const cfg = extractConfigRecord(config);
  storeReusableParameter(context.program, target, {
    name: name,
    ...(typeof cfg.description === "string" ? { description: cfg.description } : {}),
    ...(typeof cfg.location === "string" ? { location: cfg.location } : {}),
  });
}

export function $reusableCorrelationId(
  context: DecoratorContext,
  target: Namespace,
  name: unknown,
  location: unknown,
): void {
  if (!validateNonEmptyString(name, context, target, "invalid-correlationId-config", { modelName: String(name) })) {
    return;
  }
  if (!validateNonEmptyString(location, context, target, "invalid-correlationId-config", { modelName: String(name) })) {
    return;
  }
  storeReusableCorrelationId(context.program, target, {
    location: location,
    name: name,
  });
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
  const rawBindings = extractConfigRecord(config);
  const { bindings } = processBindings(rawBindings);
  storeReusableBinding(context.program, target, {
    bindings: bindings,
    name: name,
  });
}
