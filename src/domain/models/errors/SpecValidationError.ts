/**
 * AsyncAPI specification validation error
 * Used when AsyncAPI documents fail validation against the schema
 */
export class SpecValidationError extends Error {
  readonly _tag: string = "SpecValidationError";
  override readonly name: string = "SpecValidationError";

  constructor(
    message: string,
    public readonly spec: unknown,
  ) {
    super(message);
  }
}
