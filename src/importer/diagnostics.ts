export interface ImportWarning {
  code: "unsupported-field" | "normalized-value";
  pointer: string;
  message: string;
}

export class ImportInputError extends Error {
  readonly pointer: string;

  constructor(pointer: string, message: string) {
    super(message);
    this.name = "ImportInputError";
    this.pointer = pointer;
  }
}

export function fail(pointer: string, message: string): never {
  throw new ImportInputError(pointer, message);
}
