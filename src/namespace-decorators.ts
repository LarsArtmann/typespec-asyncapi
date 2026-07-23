import type {
  DecoratorContext,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { PROTOCOL_LIST, isSupportedProtocol } from "./constants/protocols.js";
import { storeDefaultContentType, storeServerConfig } from "./state-writers.js";
import {
  isValidUrl,
  reportDiagnostic,
  validateConfig,
} from "./decorator-helpers.js";

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
    reportDiagnostic(context, "unsupported-protocol", target, {
      protocol,
      validProtocols: PROTOCOL_LIST.join(", "),
    });
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
