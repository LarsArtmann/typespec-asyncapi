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
  storeOperationSecurityRef,
  storeOperationType,
  storeProtocolConfig,
  storeSecurityConfig,
  storeTags,
} from "./state-writers.js";
import {
  SCHEME_TYPE_LIST,
  isValidSchemeType,
} from "./domain/models/asyncapi-document.js";
import type { Tag } from "./domain/models/asyncapi-document.js";
import {
  extractConfigRecord,
  extractMessageConfig,
  getModelPropertyStringValue,
  getModelPropertyValue,
  isModelConfig,
  modelToRecord,
  normalizeTagItem,
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
    run: () => {
      storeMessageConfig(
        context.program,
        target,
        extractMessageConfig(config, target),
      );
    },
  });
}

/**
 * Build a `makeConfigDecorator` is to `$message` what `makeStringIdDecorator`
 * is to `$operationId`: a factory that wraps the validatedDecorator boilerplate
 * for decorators that take a single config object.
 */
function makeConfigDecorator<T>(
  code: keyof typeof $lib.diagnostics,
  format: (target: T) => Record<string, unknown>,
  run: (ctx: DecoratorContext, target: T, config: unknown) => void,
): (ctx: DecoratorContext, target: T, config: unknown) => void {
  return (ctx, target, config) =>
    validatedDecorator(ctx, target, config, {
      code,
      format: format(target),
      run: () => {
        run(ctx, target, config);
      },
    });
}

const targetKindFormat = (target: {
  kind: string;
}): Record<string, unknown> => ({
  targetKind: target.kind,
});

export const $protocol = makeConfigDecorator<Operation | Model>(
  "invalid-protocol-config",
  targetKindFormat,
  (ctx, target, cfg) => {
    const configRecord = extractConfigRecord(cfg);
    const protocol = configRecord.protocol as string | undefined;
    if (protocol && !isSupportedProtocol(protocol.toLowerCase())) {
      reportUnsupportedProtocol(ctx, target, protocol);
      return;
    }
    storeProtocolConfig(ctx.program, target, configRecord);
  },
);

export const $security = makeConfigDecorator<Operation | Namespace>(
  "invalid-security-config",
  targetKindFormat,
  (ctx, target, cfg) => {
    applySecurity({ context: ctx, target, config: cfg });
  },
);

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

  const tags: Tag[] = [];
  for (const item of value) {
    const tag = normalizeTagItem(item);
    if (!tag) {
      reportDiagnostic(
        context,
        "invalid-tags-config",
        target,
        undefined,
        "non-string",
      );
      return;
    }
    tags.push(tag);
  }

  storeTags(context.program, target as Operation, tags);
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
  if (!replyModel.name) {
    return;
  }
  storeOperationReply(context.program, target, {
    address: typeof address === "string" ? address : undefined,
    messageName: replyModel.name,
  });
}

export const $operationId = makeStringIdDecorator<Operation>(
  "invalid-operation-id",
  (target) => ({ operationName: target.name }),
  (program, target, id) => {
    storeOperationId(program, target, id);
  },
);

export const $messageId = makeStringIdDecorator<Model>(
  "invalid-message-id",
  (target) => ({ modelName: target.name }),
  (program, target, id) => {
    storeMessageId(program, target, id);
  },
);

/**
 * Build a decorator that validates a non-empty string ID and stores it.
 * Used by `@operationId` and `@messageId`.
 */
function makeStringIdDecorator<T>(
  diagnosticCode: keyof typeof $lib.diagnostics,
  format: (target: T) => Record<string, unknown>,
  store: (program: Program, target: T, id: string) => void,
): (context: DecoratorContext, target: T, id: unknown) => void {
  return (context, target, id) => {
    if (
      !validateNonEmptyString(
        id,
        context,
        target,
        diagnosticCode,
        format(target),
      )
    ) {
      return;
    }
    store(context.program, target, id);
  };
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

export function $operationSecurity(
  context: DecoratorContext,
  target: Operation,
  config: unknown,
): void {
  if (!config || typeof config !== "object") {
    return;
  }
  const c = config as Record<string, unknown>;
  const name = typeof c.name === "string" ? c.name : undefined;
  if (!name) {
    return;
  }
  const scopes = Array.isArray(c.scopes)
    ? c.scopes.filter((s): s is string => typeof s === "string")
    : undefined;
  storeOperationSecurityRef(context.program, target, {
    name,
    ...(scopes ? { scopes } : {}),
  });
}
