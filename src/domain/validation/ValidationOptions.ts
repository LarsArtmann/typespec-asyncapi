/**
 * Validation options for AsyncAPIValidator
 */
export type ValidationOptions = {
  strict?: boolean;
  enableCache?: boolean;
  benchmarking?: boolean;
  customRules?: unknown[];
};
