import type { StandardizedError } from "./StandardizedError.js";
import { createStandardizedError } from "./ErrorBase.js";

export class TypeResolutionError {
  readonly _tag = "TypeResolutionError";

  constructor(
    readonly message: string,
    readonly typeName?: string,
    readonly context?: Record<string, unknown>,
  ) {}

  toStandardizedError(): StandardizedError {
    return createStandardizedError(
      "type_error",
      "TYPE_RESOLUTION_FAILED",
      this.message,
      { typeName: this.typeName },
      this.context,
      false,
    );
  }
}
