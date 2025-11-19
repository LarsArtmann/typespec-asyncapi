/**
 * Validation diagnostic
 */
export type ValidationDiagnostic = {
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
};
