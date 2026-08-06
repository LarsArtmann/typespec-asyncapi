/**
 * Reference decorators for reusable components.
 *
 * These decorators reference reusable component definitions by name.
 * They store the reference in state; the builders resolve the name
 * to a `$ref` pointer during document assembly.
 */

import type {
  DecoratorContext,
  Model,
  Operation,
} from "@typespec/compiler";
import {
  storeBindingRef,
  storeCorrelationIdRef,
  storeMessageTraitRef,
  storeOperationTraitRef,
} from "./state-writers.js";
import { validateNonEmptyString } from "./decorator-helpers.js";

export function $useOperationTrait(
  context: DecoratorContext,
  target: Operation,
  name: unknown,
): void {
  if (
    !validateNonEmptyString(
      name,
      context,
      target,
      "invalid-trait-config",
      { traitName: String(name) },
    )
  ) {
    return;
  }
  storeOperationTraitRef(context.program, target, name);
}

export function $useMessageTrait(
  context: DecoratorContext,
  target: Model,
  name: unknown,
): void {
  if (
    !validateNonEmptyString(
      name,
      context,
      target,
      "invalid-trait-config",
      { traitName: String(name) },
    )
  ) {
    return;
  }
  storeMessageTraitRef(context.program, target, name);
}

export function $useCorrelationId(
  context: DecoratorContext,
  target: Model,
  name: unknown,
): void {
  if (
    !validateNonEmptyString(
      name,
      context,
      target,
      "invalid-correlationId-config",
      { modelName: target.name },
    )
  ) {
    return;
  }
  storeCorrelationIdRef(context.program, target, name);
}

export function $useBinding(
  context: DecoratorContext,
  target: Operation | Model,
  name: unknown,
): void {
  if (
    !validateNonEmptyString(
      name,
      context,
      target,
      "invalid-bindings-config",
      { targetKind: target.kind },
    )
  ) {
    return;
  }
  storeBindingRef(context.program, target, name);
}
