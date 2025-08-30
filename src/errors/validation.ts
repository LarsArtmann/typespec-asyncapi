/**
 * ASYNCAPI VALIDATION ERROR CLASSES
 * 
 * Handles input validation, configuration validation, and TypeSpec validation errors
 * with comprehensive recovery strategies and user-friendly messaging
 */

import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";

/**
 * AsyncAPI validation error - extends Error base class with comprehensive context
 */
export class AsyncAPIValidationError extends BaseAsyncAPIError {
  readonly _tag = "AsyncAPIValidationError" as const;
  
  constructor({
    field,
    value,
    expected,
    operation,
    recoveryValue,
    severity = "error"
  }: {
    field: string;
    value: unknown;
    expected: string;
    operation: string;
    recoveryValue?: unknown;
    severity?: ErrorSeverity;
  }) {
    const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
    
    super({
      what: `Invalid value ${valueStr} for field '${field}'. Expected ${expected}.`,
      reassure: "This is a configuration issue that can be fixed by updating the input.",
      why: "The provided value does not match the required schema constraints for this field.",
      fix: [
        `Update '${field}' to use ${expected}`,
        "Check the AsyncAPI emitter documentation for valid values",
        "Validate your configuration against the schema"
      ],
      escape: recoveryValue 
        ? `The system will use default value: ${JSON.stringify(recoveryValue)}`
        : "Remove the invalid field to use system defaults",
      severity,
      category: "validation",
      operation,
      recoveryStrategy: recoveryValue ? "default" : "prompt",
      canRecover: true,
      recoveryHint: recoveryValue ? `Using default: ${JSON.stringify(recoveryValue)}` : undefined,
      additionalData: { field, value, expected, recoveryValue }
    });
  }
}

/**
 * Schema validation error for TypeSpec models and operations
 */
export class SchemaValidationError extends BaseAsyncAPIError {
  readonly _tag = "SchemaValidationError" as const;
  
  constructor({
    schemaPath,
    constraint,
    actualValue,
    operation,
    severity = "error"
  }: {
    schemaPath: string;
    constraint: string;
    actualValue: unknown;
    operation: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Schema validation failed at path '${schemaPath}': ${constraint}`,
      reassure: "Schema validation errors indicate the TypeSpec model doesn't conform to AsyncAPI requirements.",
      why: `The value at '${schemaPath}' violates the constraint: ${constraint}`,
      fix: [
        "Update the TypeSpec model to satisfy the schema constraint",
        "Check AsyncAPI 3.0 specification for valid schema patterns",
        "Consider using AsyncAPI-specific decorators to guide schema generation"
      ],
      escape: "The invalid field will be omitted from the generated schema with a warning comment",
      severity,
      category: "validation",
      operation,
      recoveryStrategy: "skip",
      canRecover: true,
      recoveryHint: "Field will be omitted from output",
      additionalData: { schemaPath, constraint, actualValue }
    });
  }
}

/**
 * Configuration validation error for emitter options
 */
export class ConfigurationValidationError extends BaseAsyncAPIError {
  readonly _tag = "ConfigurationValidationError" as const;
  
  constructor({
    configKey,
    providedValue,
    allowedValues,
    operation,
    defaultValue,
    severity = "error"
  }: {
    configKey: string;
    providedValue: unknown;
    allowedValues: string[];
    operation: string;
    defaultValue?: unknown;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Invalid configuration value for '${configKey}': ${JSON.stringify(providedValue)}. Allowed values: ${allowedValues.join(', ')}`,
      reassure: "Configuration errors can be quickly resolved by using valid option values.",
      why: "The emitter configuration contains an invalid option value.",
      fix: [
        `Set '${configKey}' to one of: ${allowedValues.join(', ')}`,
        "Check the emitter documentation for valid configuration options",
        "Review your TypeSpec emitter configuration"
      ],
      escape: defaultValue 
        ? `Will use default value: ${JSON.stringify(defaultValue)}`
        : "Will skip this configuration option and use system defaults",
      severity,
      category: "configuration",
      operation,
      recoveryStrategy: defaultValue ? "default" : "skip",
      canRecover: true,
      recoveryHint: defaultValue ? `Default: ${JSON.stringify(defaultValue)}` : "Using system defaults",
      additionalData: { configKey, providedValue, allowedValues, defaultValue }
    });
  }
}

/**
 * Decorator validation error for AsyncAPI decorators
 */
export class DecoratorValidationError extends BaseAsyncAPIError {
  readonly _tag = "DecoratorValidationError" as const;
  
  constructor({
    decoratorName,
    targetType,
    issue,
    operation,
    suggestedFix,
    severity = "error"
  }: {
    decoratorName: string;
    targetType: string;
    issue: string;
    operation: string;
    suggestedFix?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Invalid usage of @${decoratorName} decorator on ${targetType}: ${issue}`,
      reassure: "Decorator validation errors indicate incorrect usage patterns that can be corrected.",
      why: `The @${decoratorName} decorator is not being used according to AsyncAPI emitter requirements.`,
      fix: [
        suggestedFix || `Review @${decoratorName} decorator usage requirements`,
        "Check the AsyncAPI emitter documentation for decorator examples",
        "Ensure the decorator is applied to the correct TypeSpec construct"
      ],
      escape: "The decorator will be ignored and the target will use default AsyncAPI generation behavior",
      severity,
      category: "validation",
      operation,
      recoveryStrategy: "skip",
      canRecover: true,
      recoveryHint: "Decorator will be ignored",
      additionalData: { decoratorName, targetType, issue, suggestedFix }
    });
  }
}

/**
 * Type constraint validation error
 */
export class TypeConstraintError extends BaseAsyncAPIError {
  readonly _tag = "TypeConstraintError" as const;
  
  constructor({
    typeName,
    constraintType,
    violation,
    operation,
    fallbackBehavior,
    severity = "warning"
  }: {
    typeName: string;
    constraintType: string;
    violation: string;
    operation: string;
    fallbackBehavior?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Type constraint violation in '${typeName}': ${constraintType} constraint ${violation}`,
      reassure: "Type constraint violations can usually be resolved by adjusting the TypeSpec model definition.",
      why: `The type definition violates AsyncAPI schema generation constraints.`,
      fix: [
        "Modify the TypeSpec model to satisfy the constraint",
        "Use AsyncAPI-compatible type patterns",
        "Consider using union types or optional properties for flexibility"
      ],
      escape: fallbackBehavior || "The type will be generated with relaxed constraints and a warning comment",
      severity,
      category: "validation",
      operation,
      recoveryStrategy: "degrade",
      canRecover: true,
      recoveryHint: "Will generate with relaxed constraints",
      additionalData: { typeName, constraintType, violation, fallbackBehavior }
    });
  }
}
