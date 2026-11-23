/**
 * External Docs Decorator
 *
 * `@externalDocs` attaches an External Documentation Object to an Operation,
 * a Model (message), or a Namespace (document info.externalDocs).
 */

import type {
  DecoratorContext,
  Model,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { reportDiagnostic } from "./decorator-helpers.js";
import { storeExternalDocs } from "./state-writers.js";

export function $externalDocs(
  context: DecoratorContext,
  target: Model | Operation | Namespace,
  url: unknown,
  description?: unknown,
): void {
  if (typeof url !== "string" || !isAbsoluteUrl(url)) {
    reportDiagnostic(context, "invalid-external-docs-config", target, {
      url: typeof url === "string" ? url : String(url),
    });
    return;
  }
  if (description !== undefined && typeof description !== "string") {
    reportDiagnostic(context, "invalid-external-docs-config", target, { url });
    return;
  }

  storeExternalDocs(context.program, target, url, description);
}

/** True when the string parses as an absolute URL. */
function isAbsoluteUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    return parsed.protocol !== "";
  } catch {
    return false;
  }
}
