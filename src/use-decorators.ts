/**
 * Reference decorators for reusable components.
 *
 * These decorators reference reusable component definitions by name.
 * They store the reference in state; the builders resolve the name
 * to a `$ref` pointer during document assembly.
 *
 * All four decorators share the same validate-and-store pattern, so a
 * single factory eliminates the duplication.
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

type StoreRef = (program: DecoratorContext["program"], target: Type, name: string) => void;

function makeRefDecorator(
  diagnosticCode: keyof typeof $lib.diagnostics,
  formatKey: string,
  store: StoreRef,
): (context: DecoratorContext, target: Type, name: unknown) => void {
  return (context, target, name) => {
    const format = { [formatKey]: target.kind === "Model" ? (target as Model).name : String(name) };
    if (!validateNonEmptyString(name, context, target, diagnosticCode, format)) {
      return;
    }
    store(context.program, target, name);
  };
}

export const $useOperationTrait = makeRefDecorator(
  "invalid-trait-config",
  "traitName",
  (program, target, name) => storeOperationTraitRef(program, target as Operation, name),
);

export const $useMessageTrait = makeRefDecorator(
  "invalid-trait-config",
  "traitName",
  (program, target, name) => storeMessageTraitRef(program, target as Model, name),
);

export const $useCorrelationId = makeRefDecorator(
  "invalid-correlationId-config",
  "modelName",
  (program, target, name) => storeCorrelationIdRef(program, target as Model, name),
);

export const $useBinding = makeRefDecorator(
  "invalid-bindings-config",
  "targetKind",
  (program, target, name) => storeBindingRef(program, target as Operation | Model, name),
);
