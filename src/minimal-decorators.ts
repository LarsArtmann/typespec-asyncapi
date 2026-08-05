/**
 * TypeSpec AsyncAPI Decorators
 *
 * Decorator implementations that store configuration into TypeSpec's state map.
 * State writing is delegated to state-writers.ts.
 */

import type {
  DecoratorContext,
  DiagnosticTarget,
  Model,
  ModelProperty,
  Namespace,
  Operation,
} from "@typespec/compiler";
import type { Program } from "@typespec/compiler";
import type { $lib } from "./lib.js";
import { isSupportedProtocol } from "./constants/protocols.js";
import {
  linkPublishMessage,
  storeBindings,
  storeChannelState,
  storeCorrelationId,
  storeHeader,
  storeMessageConfig,
  storeMessageId,
  storeApiVersion,
  storeOperationId,
  storeOperationReply,
  storeOperationType,
  storeProtocolConfig,
  storeSecurityConfig,
  storeTags,
} from "./state-writers.js";
import {
  SCHEME_TYPE_LIST,
  isValidSchemeType,
} from "./domain/models/asyncapi-document.js";
import {
  extractConfigRecord,
  getModelPropertyStringValue,
  getModelPropertyValue,
  isModelConfig,
  modelToRecord,
  reportDiagnostic,
  reportUnsupportedProtocol,
  validateNonEmptyString,
  validatedDecorator,
} from "./decorator-helpers.js";
import { processBindings } from "./validation/binding-validator.js";
import type { BindingTargetKind } from "./constants/binding-versions.js";

// === DECORATORS ===

export function $channel(
  context: DecoratorContext,
  target: Operation,
  path: string,
): void {
  if (!path || path.length === 0) {
    reportDiagnostic(context, "missing-channel-path", target, {
      operationName: target.name,
    });
    return;
  }
  storeChannelState(context.program, target, path);
}

export function $publish(
  context: DecoratorContext,
  target: Operation,
  config?: Model,
): void {
  storeOperationType(context.program, target, "publish", config?.name);
  linkPublishMessage(context.program, target, config);
}

export function $message(
  context: DecoratorContext,
  target: Model,
  config: unknown,
): void {
  validatedDecorator(context, target, config, {
    code: "invalid-message-config",
    format: { modelName: target.name },
    run: () =>
      storeMessageConfig(
        context.program,
        target,
        extractMessageConfig(config, target),
      ),
  });
}

function extractMessageConfig(
  config: unknown,
  target: Model,
): {
  title: string;
  description: string;
  contentType: string;
} {
  let title: string | undefined;
  let description: string | undefined;
  let contentType: string | undefined;

  if (isModelConfig(config)) {
    title = getModelPropertyStringValue(config, "title");
    description = getModelPropertyStringValue(config, "description");
    contentType = getModelPropertyStringValue(config, "contentType");
  } else if (config && typeof config === "object") {
    const configObj = config as Record<string, unknown>;
    title = typeof configObj.title === "string" ? configObj.title : undefined;
    description =
      typeof configObj.description === "string"
        ? configObj.description
        : undefined;
    contentType =
      typeof configObj.contentType === "string"
        ? configObj.contentType
        : undefined;
  }

  return {
    contentType: contentType ?? "application/json",
    description: description ?? `Message ${target.name}`,
    title: title ?? target.name,
  };
}

export function $protocol(
  context: DecoratorContext,
  target: Operation | Model,
  config: unknown,
): void {
  validatedDecorator(context, target, config, {
    code: "invalid-protocol-config",
    format: { targetKind: target.kind },
    run: () => {
      const configRecord = extractConfigRecord(config);
      const protocol = configRecord.protocol as string | undefined;
      if (protocol && !isSupportedProtocol(protocol.toLowerCase())) {
        reportUnsupportedProtocol(context, target, protocol);
        return;
      }
      storeProtocolConfig(context.program, target, configRecord);
    },
  });
}

export function $security(
  context: DecoratorContext,
  target: Operation | Namespace,
  config: unknown,
): void {
  validatedDecorator(context, target, config, {
    code: "invalid-security-config",
    format: { targetKind: target.kind },
    run: () => applySecurity({ context, target, config }),
  });
}

function applySecurity(args: {
  context: DecoratorContext;
  target: Operation | Namespace;
  config: unknown;
}): void {
  const { context, target, config } = args;
  let name: string | undefined;
  let scheme: Record<string, unknown> | undefined;

  if (isModelConfig(config)) {
    name = getModelPropertyStringValue(config, "name");
    const schemeValue = getModelPropertyValue(config, "scheme");
    if (
      schemeValue &&
      typeof schemeValue === "object" &&
      "properties" in schemeValue
    ) {
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

export function $tags(
  context: DecoratorContext,
  target: DiagnosticTarget,
  value: unknown,
): void {
  if (!value || !Array.isArray(value)) {
    reportDiagnostic(context, "invalid-tags-config", target);
    return;
  }

  const stringTags = value.filter(
    (tag): tag is string => typeof tag === "string",
  );
  if (stringTags.length !== value.length) {
    reportDiagnostic(
      context,
      "invalid-tags-config",
      target,
      undefined,
      "non-string",
    );
    return;
  }

  storeTags(context.program, target as Operation, stringTags);
}

export function $correlationId(
  context: DecoratorContext,
  target: Model,
  location: unknown,
): void {
  if (
    !validateNonEmptyString(
      location,
      context,
      target,
      "invalid-correlationId-config",
      {
        modelName: target.name,
      },
    )
  ) {
    return;
  }

  storeCorrelationId(context.program, target, location);
}

function bindingTargetKind(kind: string): BindingTargetKind | undefined {
  if (kind === "Operation") {
    return "operation";
  }
  if (kind === "Model") {
    return "message";
  }
  if (kind === "Namespace") {
    return "server";
  }
  return undefined;
}

export function $bindings(
  context: DecoratorContext,
  target: Operation | Model | Namespace,
  value: unknown,
): void {
  if (!value || typeof value !== "object") {
    reportDiagnostic(context, "invalid-bindings-config", target, {
      targetKind: target.kind,
    });
    return;
  }

  const rawBindings = extractConfigRecord(value);
  const targetKind = bindingTargetKind(target.kind);
  const { bindings, issues } = processBindings(rawBindings, targetKind);

  for (const issue of issues) {
    reportDiagnostic(context, issue.code, target, issue.format);
  }

  storeBindings(context.program, target, bindings);
}

export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  value?: unknown,
): void {
  if (
    !validateNonEmptyString(name, context, target, "invalid-header-config", {
      targetKind: target.kind,
    })
  ) {
    return;
  }

  storeHeader(context.program, target, name, value);
}

export function $reply(
  context: DecoratorContext,
  target: Operation,
  replyModel: Model,
  address?: unknown,
): void {
  if (!replyModel || !replyModel.name) {
    return;
  }
  storeOperationReply(context.program, target, {
    address: typeof address === "string" ? address : undefined,
    messageName: replyModel.name,
  });
}

export function $operationId(
  context: DecoratorContext,
  target: Operation,
  id: unknown,
): void {
  applyStringIdDecorator({
    context,
    target,
    id,
    diagnosticCode: "invalid-operation-id",
    format: { operationName: target.name },
    store: (program) => storeOperationId(program, target, id as string),
  });
}

export function $messageId(
  context: DecoratorContext,
  target: Model,
  id: unknown,
): void {
  applyStringIdDecorator({
    context,
    target,
    id,
    diagnosticCode: "invalid-message-id",
    format: { modelName: target.name },
    store: (program) => storeMessageId(program, target, id as string),
  });
}

/**
 * Shared body for decorators that take a single non-empty string ID argument
 * and store it. Used by `@operationId` and `@messageId`.
 */
function applyStringIdDecorator(opts: {
  context: DecoratorContext;
  target: unknown;
  id: unknown;
  diagnosticCode: keyof typeof $lib.diagnostics;
  format?: Record<string, unknown>;
  store: (program: Program, id: string) => void;
}): void {
  if (
    !validateNonEmptyString(
      opts.id,
      opts.context,
      opts.target,
      opts.diagnosticCode,
      opts.format,
    )
  ) {
    return;
  }
  opts.store(opts.context.program, opts.id);
}

export function $apiVersion(
  context: DecoratorContext,
  target: Namespace,
  version: unknown,
): void {
  if (!version || typeof version !== "string") {
    return;
  }
  storeApiVersion(context.program, target, version);
}
