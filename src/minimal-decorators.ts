/**
 * TypeSpec AsyncAPI Decorators
 *
 * Decorator implementations that store configuration into TypeSpec's state map.
 * State writing is delegated to state-writers.ts.
 */

import type {
  DecoratorContext,
  Namespace,
  Operation,
  Model,
  ModelProperty,
  DiagnosticTarget,
} from "@typespec/compiler";
import { PROTOCOL_LIST, isSupportedProtocol } from "./constants/protocols.js";
import {
  storeChannelState,
  storeOperationType,
  storeMessageConfig,
  storeServerConfig,
  storeSecurityConfig,
  storeTags,
  storeCorrelationId,
  storeBindings,
  storeHeader,
  storeProtocolConfig,
  linkPublishMessage,
} from "./state-writers.js";
import { isValidSchemeType, SCHEME_TYPE_LIST } from "./domain/models/asyncapi-document.js";
import {
  reportDiagnostic,
  validateConfig,
  isValidUrl,
  getModelPropertyStringValue,
  getModelPropertyValue,
  modelToRecord,
  extractConfigRecord,
} from "./decorator-helpers.js";
import { processBindings } from "./validation/binding-validator.js";

// === DECORATORS ===

export function $channel(context: DecoratorContext, target: Operation, path: string): void {
  if (!path || path.length === 0) {
    reportDiagnostic(context, "missing-channel-path", target, {
      operationName: target.name,
    });
    return;
  }
  storeChannelState(context.program, target, path);
}

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
    !validateConfig(config, context, target, "invalid-server-config", {
      serverName: name,
    })
  )
    return;

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
    reportDiagnostic(context, "unsupported-protocol", target, {
      protocol,
      validProtocols: PROTOCOL_LIST.join(", "),
    });
    return;
  }

  storeServerConfig(context.program, target, { ...configTyped, name });
}

export function $publish(context: DecoratorContext, target: Operation, config?: Model): void {
  storeOperationType(context.program, target, "publish", config?.name);
  linkPublishMessage(context.program, target, config);
}

export function $message(context: DecoratorContext, target: Model, config: unknown): void {
  if (
    !validateConfig(config, context, target, "invalid-message-config", {
      modelName: target.name,
    })
  )
    return;

  let title: string | undefined;
  let description: string | undefined;
  let contentType: string | undefined;

  if (config && typeof config === "object" && "kind" in config && config.kind === "Model") {
    const configModel = config as Model;
    title = getModelPropertyStringValue(configModel, "title");
    description = getModelPropertyStringValue(configModel, "description");
    contentType = getModelPropertyStringValue(configModel, "contentType");
  } else if (config && typeof config === "object") {
    const configObj = config as Record<string, unknown>;
    title = typeof configObj.title === "string" ? configObj.title : undefined;
    description = typeof configObj.description === "string" ? configObj.description : undefined;
    contentType = typeof configObj.contentType === "string" ? configObj.contentType : undefined;
  }

  storeMessageConfig(context.program, target, {
    title: title ?? target.name,
    description: description ?? `Message ${target.name}`,
    contentType: contentType ?? "application/json",
  });
}

export function $protocol(
  context: DecoratorContext,
  target: Operation | Model,
  config: unknown,
): void {
  if (
    !validateConfig(config, context, target, "invalid-protocol-config", {
      targetKind: target.kind,
    })
  )
    return;

  const configRecord = extractConfigRecord(config);
  const protocol = configRecord.protocol as string | undefined;
  if (protocol && !isSupportedProtocol(protocol.toLowerCase())) {
    reportDiagnostic(context, "unsupported-protocol", target, {
      protocol,
      validProtocols: PROTOCOL_LIST.join(", "),
    });
    return;
  }
  storeProtocolConfig(context.program, target, configRecord);
}

export function $security(
  context: DecoratorContext,
  target: Operation | Namespace,
  config: unknown,
): void {
  if (
    !validateConfig(config, context, target, "invalid-security-config", {
      targetKind: target.kind,
    })
  )
    return;

  let name: string | undefined;
  let scheme: Record<string, unknown> | undefined;

  if (config && typeof config === "object" && "kind" in config && config.kind === "Model") {
    const configModel = config as Model;
    name = getModelPropertyStringValue(configModel, "name");
    const schemeValue = getModelPropertyValue(configModel, "scheme");
    if (schemeValue && typeof schemeValue === "object" && "properties" in schemeValue) {
      scheme = modelToRecord(schemeValue as Model);
    } else if (schemeValue && typeof schemeValue === "object") {
      scheme = schemeValue as Record<string, unknown>;
    }
  } else {
    const configTyped = config as Record<string, unknown>;
    name = configTyped.name as string;
    scheme = configTyped.scheme as Record<string, unknown>;
  }

  if (name && scheme && Object.keys(scheme).length > 0) {
    const schemeType = scheme.type;
    if (typeof schemeType !== "string" || !isValidSchemeType(schemeType)) {
      reportDiagnostic(context, "invalid-security-scheme-type", target, {
        schemeType: String(schemeType),
        validTypes: SCHEME_TYPE_LIST.join(", "),
      });
      return;
    }
    storeSecurityConfig(context.program, target, {
      name,
      scheme: { ...scheme, type: schemeType },
    });
  }
}

export function $subscribe(context: DecoratorContext, target: Operation): void {
  storeOperationType(context.program, target, "subscribe");
}

export function $tags(context: DecoratorContext, target: DiagnosticTarget, value: unknown): void {
  if (!value || !Array.isArray(value)) {
    reportDiagnostic(context, "invalid-tags-config", target);
    return;
  }

  const stringTags = value.filter((tag): tag is string => typeof tag === "string");
  if (stringTags.length !== value.length) {
    reportDiagnostic(context, "invalid-tags-config", target, undefined, "non-string");
    return;
  }

  storeTags(context.program, target as Operation, stringTags);
}

export function $correlationId(context: DecoratorContext, target: Model, location: unknown): void {
  if (!location || typeof location !== "string") {
    reportDiagnostic(context, "invalid-correlationId-config", target, {
      modelName: target.name,
    });
    return;
  }

  storeCorrelationId(context.program, target, location);
}

export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {
  if (!value || typeof value !== "object") {
    reportDiagnostic(context, "invalid-bindings-config", target, {
      targetKind: target.kind,
    });
    return;
  }

  const rawBindings = extractConfigRecord(value);
  const { bindings, issues } = processBindings(rawBindings);

  for (const issue of issues) {
    reportDiagnostic(context, issue.code as "unknown-binding-protocol", target, issue.format);
  }

  storeBindings(context.program, target, bindings);
}

export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  value?: unknown,
): void {
  if (!name || typeof name !== "string") {
    reportDiagnostic(context, "invalid-header-config", target, {
      targetKind: target.kind,
    });
    return;
  }

  storeHeader(context.program, target, name, value);
}
