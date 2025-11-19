/**
 * Error thrown when emitter initialization fails
 * Used during emitter setup and configuration
 */
export class EmitterInitializationError extends Error {
  readonly _tag = "EmitterInitializationError";
  override readonly name = "EmitterInitializationError";
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
