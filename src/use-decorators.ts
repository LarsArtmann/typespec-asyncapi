/**
 * Reference decorators for reusable components.
 *
 * Each decorator validates a non-empty string name via `validateNameAndRun`
 * and stores it as a reference. No hand-written validation boilerplate.
 */

import type { DecoratorContext } from "@typespec/compiler";
import type { Type } from "@typespec/compiler";
import {
  storeBindingRef,
  storeCorrelationIdRef,
  storeMessageTraitRef,
  storeOperationTraitRef,
} from "./state-writers.js";
import { validateNameAndRun } from "./decorator-helpers.js";

export function $useOperationTrait(context: DecoratorContext, target: Type, name: unknown): void {
  validateNameAndRun({ context, target, name, code: "invalid-trait-config", formatKey: "traitName", onValid: (n) => storeOperationTraitRef(context.program, target, n) });
}

export function $useMessageTrait(context: DecoratorContext, target: Type, name: unknown): void {
  validateNameAndRun({ context, target, name, code: "invalid-trait-config", formatKey: "traitName", onValid: (n) => storeMessageTraitRef(context.program, target, n) });
}

export function $useCorrelationId(context: DecoratorContext, target: Type, name: unknown): void {
  validateNameAndRun({ context, target, name, code: "invalid-correlationId-config", formatKey: "modelName", onValid: (n) => storeCorrelationIdRef(context.program, target, n) });
}

export function $useBinding(context: DecoratorContext, target: Type, name: unknown): void {
  validateNameAndRun({ context, target, name, code: "invalid-bindings-config", formatKey: "targetKind", onValid: (n) => storeBindingRef(context.program, target, n) });
}
