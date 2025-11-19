/**
 * Base error class for performance-related errors with cause support
 */
export abstract class PerformanceError extends Error {
  abstract readonly _tag: string;

  constructor(
    public override readonly message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    if (cause) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}
