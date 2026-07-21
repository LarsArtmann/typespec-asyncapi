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
import {
  isValidSchemeType,
  SCHEME_TYPE_LIST,
  type ProtocolBindings,
} from "./domain/models/asyncapi-document.js";
import {
  reportDecoratorDiagnostic,
  validateConfig,
  getModelPropertyStringValue,
  getModelPropertyValue,
  modelToRecord,
  extractConfigRecord,
} from "./decorator-helpers.js";

// === DECORATORS ===

export function $channel(context: DecoratorContext, target: Operation, path: string): void {
  if (!path || path.length === 0) {
    reportDecoratorDiagnostic(
      context,
      "missing-channel-path",
      target,
      `Operation '${target.name}' missing @channel decorator path`,
    );
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
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-target-invalid",
      target,
      "@server can only be applied to namespaces",
    );
    return;
  }

  if (
    !validateConfig(
      config,
      context,
      target,
      "@lars-artmann/typespec-asyncapi/invalid-server-config",
      "Server configuration is missing",
    )
  )
    return;

  const configTyped = config as Record<string, unknown>;

  if (!configTyped.url) {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-url-required",
      target,
      "Server URL is required",
    );
    return;
  }

  if (!configTyped.protocol) {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-protocol-required",
      target,
      "Server protocol is required",
    );
    return;
  }

  const protocol = (configTyped.protocol as string).toLowerCase();
  if (!isSupportedProtocol(protocol)) {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/unsupported-protocol",
      target,
      `Protocol '${protocol}' is not supported. Supported protocols: ${PROTOCOL_LIST.join(", ")}`,
    );
    return;
  }

  storeServerConfig(context.program, target, { ...configTyped, name });
}

export function $publish(context: DecoratorContext, target: Operation, config?: Model): void {
  storeOperationType(
    context.program,
    target,
    "publish",
    config?.name,
    `Publish operation for ${target.name ?? "unnamed"}`,
  );
  linkPublishMessage(context.program, target, config);
}

export function $message(context: DecoratorContext, target: Model, config: unknown): void {
  if (
    !validateConfig(
      config,
      context,
      target,
      "invalid-message-config",
      `Message model '${target.name}' missing configuration. Use @message with configuration object.`,
    )
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
    !validateConfig(
      config,
      context,
      target,
      "invalid-protocol-config",
      `Protocol configuration missing for '${target.kind}'. Use @protocol with configuration object.`,
    )
  )
    return;

  const configRecord = extractConfigRecord(config);
  const protocol = configRecord.protocol as string | undefined;
  if (protocol && !isSupportedProtocol(protocol.toLowerCase())) {
    reportDecoratorDiagnostic(
      context,
      "unsupported-protocol",
      target,
      `Protocol '${protocol}' is not supported. Supported protocols: ${PROTOCOL_LIST.join(", ")}`,
    );
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
    !validateConfig(
      config,
      context,
      target,
      "invalid-security-config",
      `Security configuration missing for '${target.kind}'. Use @security with configuration object.`,
    )
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
      reportDecoratorDiagnostic(
        context,
        "invalid-security-scheme-type",
        target,
        `Unsupported security scheme type '${String(schemeType)}'. Valid types: ${SCHEME_TYPE_LIST.join(", ")}`,
      );
      return;
    }
    storeSecurityConfig(context.program, target, {
      name,
      scheme: { ...scheme, type: schemeType },
    });
  }
}

export function $subscribe(context: DecoratorContext, target: Operation): void {
  storeOperationType(
    context.program,
    target,
    "subscribe",
    undefined,
    `Subscribe operation for ${target.name ?? "unnamed"}`,
  );
}

export function $tags(context: DecoratorContext, target: DiagnosticTarget, value: unknown): void {
  if (!value || !Array.isArray(value)) {
    reportDecoratorDiagnostic(
      context,
      "invalid-tags-config",
      target,
      "Tags configuration missing or invalid. Use @tags with string array.",
    );
    return;
  }

  const stringTags = value.filter((tag): tag is string => typeof tag === "string");
  if (stringTags.length !== value.length) {
    reportDecoratorDiagnostic(context, "invalid-tags-config", target, "All tags must be strings.");
    return;
  }

  storeTags(context.program, target as Operation, stringTags);
}

export function $correlationId(
  context: DecoratorContext,
  target: Model,
  location: unknown,
  property?: unknown,
): void {
  if (!location || typeof location !== "string") {
    reportDecoratorDiagnostic(
      context,
      "invalid-correlationId-config",
      target,
      `Correlation ID location missing for model '${target.name}'. Use @correlationId with location path.`,
    );
    return;
  }

  storeCorrelationId(context.program, target, location, property as string | undefined);
}

export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {
  if (!value || typeof value !== "object") {
    reportDecoratorDiagnostic(
      context,
      "invalid-bindings-config",
      target,
      `Protocol bindings missing for '${target.kind}'. Use @bindings with configuration object.`,
    );
    return;
  }

  const bindings = extractConfigRecord(value);
  storeBindings(context.program, target, bindings as ProtocolBindings);
}

export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  value?: unknown,
): void {
  if (!name || typeof name !== "string") {
    reportDecoratorDiagnostic(
      context,
      "invalid-header-config",
      target,
      `Header name missing for '${target.kind}'. Use @header with name and value.`,
    );
    return;
  }

  storeHeader(context.program, target, name, value);
}
