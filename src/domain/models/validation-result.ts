/**
 * 📊 ASYNCAPI VALIDATION RESULT UTILITIES
 * 
 * Provides utility functions and types for AsyncAPI validation.
 * Used by critical validation tests and core functionality.
 */

/**
 * Validation result interface
 */
export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation metrics for performance tracking
 */
export type ValidationMetrics = {
  duration: number;
  documentSize: number;
  complexity: number;
}

/**
 * Extract channel count from AsyncAPI document
 */
export function getChannelCount(doc: Record<string, unknown>): number {
  if (!doc.channels) return 0;
  return Object.keys(doc.channels).length;
}

/**
 * Extract operation count from AsyncAPI document
 */
export function getOperationCount(doc: Record<string, unknown>): number {
  if (!doc.operations) return 0;
  return Object.keys(doc.operations).length;
}

/**
 * Extract schema count from AsyncAPI document
 */
export function getSchemaCount(doc: Record<string, unknown>): number {
  if (!doc.schemas) return 0;
  return Object.keys(doc.schemas).length;
}

/**
 * Extract server count from AsyncAPI document
 */
export function getServerCount(doc: Record<string, unknown>): number {
  if (!doc.servers) return 0;
  return Object.keys(doc.servers).length;
}

/**
 * Get validation metrics from AsyncAPI document
 */
export function getValidationMetrics(doc: Record<string, unknown>): ValidationMetrics {
  return {
    duration: 0,
    documentSize: JSON.stringify(doc).length,
    complexity: getChannelCount(doc) + getOperationCount(doc) + getSchemaCount(doc)
  };
}

/**
 * Type guard for ValidationSuccess result
 */
export function isSuccess(result: { _tag: string }): result is { _tag: "Success" } {
  return result._tag === "Success";
}