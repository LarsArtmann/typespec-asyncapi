/**
 * Reference decorators for reusable components.
 *
 * Each decorator validates a non-empty string name and stores it as a
 * reference via a shared implementation driven by a data config object.
 */

import type { DecoratorContext } from "@typespec/compiler";
import type { Type } from "@typespec/compiler";
import {
  storeBindingRef,
  storeCorrelationIdRef,
  storeMessageTraitRef,
  storeOperationTraitRef,
} from "./state-writers.js";
import { validateNonEmptyString } from "./decorator-helpers.js";
import type { $lib } from "./lib.js";

type RefStore = (program: DecoratorContext["program"], target: Type, name: string) => void;

function refDecorator(code: keyof typeof $lib.diagnostics, formatKey: string, store: RefStore) {
  return (context: DecoratorContext, target: Type, name: unknown): void => {
    if (
      !validateNonEmptyString(name, context, target, code, {
        [formatKey]: String(name),
      })
    ) {
      return;
    }
    store(context.program, target, name);
  };
}

export const $useOperationTrait = refDecorator(
  "invalid-trait-config",
  "traitName",
  storeOperationTraitRef,
);
export const $useMessageTrait = refDecorator(
  "invalid-trait-config",
  "traitName",
  storeMessageTraitRef,
);
export const $useCorrelationId = refDecorator(
  "invalid-correlationId-config",
  "modelName",
  storeCorrelationIdRef,
);
export const $useBinding = refDecorator("invalid-bindings-config", "targetKind", storeBindingRef);
