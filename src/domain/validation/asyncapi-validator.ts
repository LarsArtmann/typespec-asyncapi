/**
 * AsyncAPI Specification Validator
 */

import type { AsyncAPIDocument } from "../../emitter.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate AsyncAPI 3.0 document
 */
export function validateAsyncAPI(document: AsyncAPIDocument): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!document.asyncapi) {
    errors.push("Missing asyncapi version");
  }

  if (!document.info) {
    errors.push("Missing info section");
  } else {
    if (!document.info.title) {
      errors.push("Missing info.title");
    }
    if (!document.info.version) {
      errors.push("Missing info.version");
    }
  }

  // Channel validation
  if (document.channels && Object.keys(document.channels).length === 0) {
    warnings.push("No channels defined");
  }

  // Message validation
  if (document.messages && Object.keys(document.messages).length === 0) {
    warnings.push("No messages defined");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if document is production ready
 */
export function isProductionReady(document: AsyncAPIDocument): boolean {
  const validation = validateAsyncAPI(document);
  
  return (
    validation.valid &&
    validation.errors.length === 0 &&
    validation.warnings.length === 0
  );
}

/**
 * Get validation summary
 */
export function getValidationSummary(document: AsyncAPIDocument): string {
  const validation = validateAsyncAPI(document);
  
  const summary = [];
  
  if (validation.valid) {
    summary.push("✅ Valid AsyncAPI 3.0 document");
  } else {
    summary.push(`❌ Invalid AsyncAPI document with ${validation.errors.length} errors`);
    validation.errors.forEach(error => summary.push(`   - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    summary.push(`⚠️  ${validation.warnings.length} warnings:`);
    validation.warnings.forEach(warning => summary.push(`   - ${warning}`));
  }
  
  return summary.join('\n');
}