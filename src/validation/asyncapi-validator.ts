/**
 * AsyncAPI Validation Module using REAL @asyncapi/parser
 * 
 * This uses the official AsyncAPI parser instead of custom AJV validation.
 * Exactly as requested: "import { fromString } from @asyncapi/parser"
 */

import { Effect } from "effect";
import { Parser } from "@asyncapi/parser";

// Validation error type based on AsyncAPI parser diagnostics
export type ValidationError = {
  message: string;
  keyword: string;
  instancePath: string;
  schemaPath: string;
}

/**
 * Validation result type with comprehensive metrics and diagnostics
 */
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  summary: string;
  metrics: {
    duration: number;
    channelCount: number;
    operationCount: number;
    schemaCount: number;
    validatedAt: Date;
  };
}

/**
 * Validation options for AsyncAPIValidator
 */
export type ValidationOptions = {
  strict?: boolean;
  enableCache?: boolean;
  benchmarking?: boolean;
  customRules?: unknown[];
}

/**
 * Validation statistics for reporting
 */
export type ValidationStats = {
  totalValidations: number;
  averageDuration: number;
  cacheHits: number;
}

/**
 * AsyncAPI 3.0 Validator Class using REAL @asyncapi/parser
 * 
 * Production-ready validator using the official AsyncAPI parser library.
 */
export class AsyncAPIValidator {
  private readonly parser: Parser;
  private readonly stats: ValidationStats;
  private initialized = false;

  constructor(_options: ValidationOptions = {}) {
    // Options parameter is available for future use but not currently needed

    this.stats = {
      totalValidations: 0,
      averageDuration: 0,
      cacheHits: 0,
    };

    // Initialize the REAL AsyncAPI parser
    this.parser = new Parser();
  }

  /**
   * Initialize the validator with AsyncAPI parser
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("🔧 Initializing AsyncAPI 3.0.0 Validator with REAL @asyncapi/parser...");
    this.initialized = true;
    console.log("✅ AsyncAPI 3.0.0 Validator initialized successfully");
  }

  /**
   * Validate AsyncAPI document using the REAL parser
   */
  async validate(document: unknown, _identifier?: string): Promise<ValidationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Convert document to string for parser
      const content = typeof document === 'string' ? document : JSON.stringify(document, null, 2);
      
      // Use the REAL AsyncAPI parser
      const { document: parsedDocument, diagnostics } = await this.parser.parse(content);
      const duration = performance.now() - startTime;

      // Update statistics
      this.updateStats(duration);

      // Extract metrics from document
      const metrics = this.extractMetrics(parsedDocument, duration);

      if (diagnostics.length === 0) {
        return {
          valid: true,
          errors: [],
          warnings: [],
          summary: `AsyncAPI document is valid (${duration.toFixed(2)}ms)`,
          metrics,
        };
      } else {
        // Convert diagnostics to validation errors
        const errors: ValidationError[] = diagnostics
          .filter(d => d.severity === 0) // Error level
          .map(d => ({
            message: d.message,
            keyword: String(d.code || "validation-error"),
            instancePath: d.path?.join('.') || "",
            schemaPath: d.path?.join('.') || "",
          }));

        const warnings = diagnostics
          .filter(d => d.severity === 1) // Warning level
          .map(d => d.message);

        return {
          valid: errors.length === 0,
          errors,
          warnings,
          summary: `AsyncAPI document validation completed (${errors.length} errors, ${warnings.length} warnings, ${duration.toFixed(2)}ms)`,
          metrics,
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateStats(duration);

      return {
        valid: false,
        errors: [{
          message: `Parser failed: ${error instanceof Error ? error.message : String(error)}`,
          keyword: "parse-error",
          instancePath: "",
          schemaPath: "",
        }],
        warnings: [],
        summary: `Parser failed with error (${duration.toFixed(2)}ms)`,
        metrics: this.extractMetrics(null, duration),
      };
    }
  }

  /**
   * Validate AsyncAPI document from file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    try {
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");
      return this.validate(content, filePath);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
          keyword: "file-error",
          instancePath: "",
          schemaPath: "",
        }],
        warnings: [],
        summary: "File reading failed",
        metrics: this.extractMetrics(null, 0),
      };
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): ValidationStats {
    return { ...this.stats };
  }

  /**
   * Extract metrics from AsyncAPI document
   */
  private extractMetrics(document: unknown, duration: number) {
    let channelCount = 0;
    let operationCount = 0;
    let schemaCount = 0;

    if (document && typeof document === 'object') {
      const doc = document as any;
      
      // Try to extract metrics from parsed document
      if (doc.channels) {
        channelCount = Object.keys(doc.channels).length;
      }
      if (doc.operations) {
        operationCount = Object.keys(doc.operations).length;
      }
      if (doc.components?.schemas) {
        schemaCount = Object.keys(doc.components.schemas).length;
      }
    }
    
    return {
      duration,
      channelCount,
      operationCount,
      schemaCount,
      validatedAt: new Date(),
    };
  }

  /**
   * Update validation statistics
   */
  private updateStats(duration: number) {
    this.stats.totalValidations++;
    
    // Update rolling average
    if (this.stats.totalValidations === 1) {
      this.stats.averageDuration = duration;
    } else {
      this.stats.averageDuration = 
        (this.stats.averageDuration * (this.stats.totalValidations - 1) + duration) / 
        this.stats.totalValidations;
    }
  }
}

// Legacy function exports for backward compatibility
/**
 * @deprecated Use AsyncAPIValidator class instead
 */
export async function validateAsyncAPIFile(filePath: string): Promise<{ valid: boolean; errors: ValidationError[]; warnings: string[] }> {
  const validator = new AsyncAPIValidator({ strict: false });
  await validator.initialize();
  const result = await validator.validateFile(filePath);
  
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

/**
 * @deprecated Use AsyncAPIValidator class instead
 */
export async function validateAsyncAPIString(content: string): Promise<{ valid: boolean; errors: ValidationError[]; warnings: string[] }> {
  const validator = new AsyncAPIValidator({ strict: false });
  await validator.initialize();
  const result = await validator.validate(content);
  
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

/**
 * Effect.TS wrapper for AsyncAPI validation
 */
export const validateAsyncAPIEffect = (content: string): Effect.Effect<{ valid: boolean; errors: ValidationError[]; warnings: string[] }, Error> =>
  Effect.tryPromise({
    try: () => validateAsyncAPIString(content),
    catch: (error) => new Error(`AsyncAPI validation failed: ${error}`)
  });

/**
 * Validate AsyncAPI document with detailed diagnostics
 */
export async function validateWithDiagnostics(content: string): Promise<{
  valid: boolean;
  diagnostics: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    path?: string;
  }>;
}> {
  const result = await validateAsyncAPIString(content);
  
  const diagnostics: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    path?: string;
  }> = result.errors.map((err: ValidationError) => ({
    severity: "error" as const,
    message: err.message,
    path: err.instancePath
  }));
  
  result.warnings.forEach(warn => {
    diagnostics.push({
      severity: "warning" as const,
      message: warn
    });
  });
  
  return {
    valid: result.valid,
    diagnostics
  };
}

/**
 * Quick validation check - returns boolean only
 */
export async function isValidAsyncAPI(content: string): Promise<boolean> {
  try {
    const result = await validateAsyncAPIString(content);
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Main validation function used by test helpers
 */
export async function validateAsyncAPIDocument(document: unknown, options: { strict?: boolean; enableCache?: boolean } = {}): Promise<ValidationResult> {
  const validator = new AsyncAPIValidator(options);
  await validator.initialize();
  return validator.validate(document);
}

// Re-export types for compatibility
export type AsyncAPIValidationResult = ValidationResult;
export type AsyncAPIValidatorOptions = ValidationOptions;