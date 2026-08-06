/**
 * Reference decorators for reusable components.
 *
 * Each decorator validates a non-empty string name and stores it as a
 * reference. A shared implementation eliminates duplication; the per-decorator
 * configuration is a data object, not hand-written boilerplate.
 */

import type {
  DecoratorContext,
  Model,
  Operation,
} from "@typespec/compiler";
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

interface RefDecoratorConfig {
  code: keyof typeof $lib.diagnostics;
  formatKey: string;
  store: RefStore;
}

function refDecorator(config: RefDecoratorConfig) {
  return (context: DecoratorContext, target: Type, name: unknown): void => {
    if (!validateNonEmptyString(name, context, target, config.code, { [config.formatKey]: String(name) })) {
      return;
    }
    config.store(context.program, target, name);
  };
}

export const $useOperationTrait = refDecorator({
  code: "invalid-trait-config",
  formatKey: "traitName",
  store: (p, t, n) => { storeOperationTraitRef(p, t as Operation, n); },
});

export const $useMessageTrait = refDecorator({
  code: "invalid-trait-config",
  formatKey: "traitName",
  store: (p, t, n) => { storeMessageTraitRef(p, t as Model, n); },
});

export const $useCorrelationId = refDecorator({
  code: "invalid-correlationId-config",
  formatKey: "modelName",
  store: (p, t, n) => { storeCorrelationIdRef(p, t as Model, n); },
});

export const $useBinding = refDecorator({
  code: "invalid-bindings-config",
  formatKey: "targetKind",
  store: (p, t, n) => { storeBindingRef(p, t as Operation | Model, n); },
});
