/**
 * SCHEMA GENERATION ERROR CLASSES
 * 
 * Handles AsyncAPI schema generation errors, type conversion errors,
 * and schema validation errors with recovery strategies
 */

import type { DiagnosticTarget, SourceLocation } from "@typespec/compiler";
import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";

/**
 * Schema generation error for TypeSpec to AsyncAPI conversion issues
 */
export class SchemaGenerationError extends BaseAsyncAPIError {
  readonly _tag = "SchemaGenerationError" as const;
  
  constructor({
    typeName,
    issue,
    operation,
    target,
    source,
    fallbackSchema,
    severity = "error"
  }: {
    typeName: string;
    issue: string;
    operation: string;
    target?: DiagnosticTarget;
    source?: SourceLocation;
    fallbackSchema?: Record<string, unknown>;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Failed to generate AsyncAPI schema for type '${typeName}': ${issue}`,
      reassure: "Schema generation issues can usually be resolved by updating the TypeSpec definition.",
      why: "The TypeSpec type definition contains patterns that cannot be converted to AsyncAPI 3.0 schema format.",
      fix: [
        "Check if the type uses supported TypeSpec features",
        "Ensure all referenced types are properly defined",
        "Avoid circular references in type definitions",
        "Consider using AsyncAPI-specific decorators for complex cases"
      ],
      escape: fallbackSchema 
        ? "Will use a simplified fallback schema with type annotation"
        : "The type will be omitted from the generated schema with a comment indicating the issue",
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: fallbackSchema ? "fallback" : "skip",
      canRecover: true,
      recoveryHint: fallbackSchema ? "Using fallback schema" : "Type will be documented as unsupported",
      additionalData: { typeName, issue, target, source, fallbackSchema }
    });
  }
}

/**
 * Circular reference error in type definitions
 */
export class CircularReferenceError extends BaseAsyncAPIError {
  readonly _tag = "CircularReferenceError" as const;
  
  constructor({
    typeName,
    referenceChain,
    operation,
    severity = "warning"
  }: {
    typeName: string;
    referenceChain: string[];
    operation: string;
    severity?: ErrorSeverity;
  }) {
    const chainStr = referenceChain.join(' → ');
    
    super({
      what: `Circular reference detected in type '${typeName}': ${chainStr}`,
      reassure: "Circular references can be resolved using AsyncAPI reference objects or by restructuring the type hierarchy.",
      why: "The type definition contains a circular dependency that prevents straightforward schema generation.",
      fix: [
        "Break the circular reference by using optional properties",
        "Restructure the type hierarchy to eliminate cycles",
        "Use AsyncAPI $ref patterns for recursive types",
        "Consider using union types or inheritance to reduce complexity"
      ],
      escape: "Will generate schema with $ref to break the circular dependency",
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: "fallback",
      canRecover: true,
      recoveryHint: "Using $ref for circular types",
      additionalData: { typeName, referenceChain }
    });
  }
}

/**
 * Unsupported type feature error
 */
export class UnsupportedTypeError extends BaseAsyncAPIError {
  readonly _tag = "UnsupportedTypeError" as const;
  
  constructor({
    typeName,
    unsupportedFeature,
    operation,
    alternative,
    severity = "warning"
  }: {
    typeName: string;
    unsupportedFeature: string;
    operation: string;
    alternative?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Type '${typeName}' uses unsupported feature: ${unsupportedFeature}`,
      reassure: "Unsupported features can often be worked around using AsyncAPI-compatible alternatives.",
      why: "The type uses TypeSpec features that don't have direct equivalents in AsyncAPI 3.0 schema format.",
      fix: [
        alternative || "Replace the unsupported feature with AsyncAPI-compatible patterns",
        "Use simpler type definitions that map directly to JSON Schema",
        "Consider using decorators to provide AsyncAPI-specific metadata",
        "Review AsyncAPI 3.0 schema specification for supported patterns"
      ],
      escape: "Will generate a generic object schema with extension properties to document the original intent",
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: "degrade",
      canRecover: true,
      recoveryHint: "Using generic schema with metadata",
      additionalData: { typeName, unsupportedFeature, alternative }
    });
  }
}

/**
 * Type resolution error when referenced types cannot be found
 */
export class TypeResolutionError extends BaseAsyncAPIError {
  readonly _tag = "TypeResolutionError" as const;
  
  constructor({
    referencingType,
    missingType,
    operation,
    suggestedTypes,
    severity = "error"
  }: {
    referencingType: string;
    missingType: string;
    operation: string;
    suggestedTypes?: string[];
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Cannot resolve type reference '${missingType}' in type '${referencingType}'`,
      reassure: "Type resolution errors can be fixed by ensuring all referenced types are properly imported and defined.",
      why: "A type definition references another type that cannot be found in the current scope.",
      fix: [
        "Import the missing type from its defining module",
        "Check for typos in the type name",
        suggestedTypes ? `Did you mean one of: ${suggestedTypes.join(', ')}?` : "Verify the type is correctly defined",
        "Ensure the type is exported from its module"
      ],
      escape: "Will use 'unknown' type as placeholder and document the missing reference",
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: "degrade",
      canRecover: true,
      recoveryHint: "Using unknown type placeholder",
      additionalData: { referencingType, missingType, suggestedTypes }
    });
  }
}

/**
 * Schema validation error when generated schema doesn't conform to AsyncAPI spec
 */
export class SchemaValidationError extends BaseAsyncAPIError {
  readonly _tag = "SchemaValidationError" as const;
  
  constructor({
    schemaPath,
    validationError,
    operation,
    correctedSchema,
    severity = "error"
  }: {
    schemaPath: string;
    validationError: string;
    operation: string;
    correctedSchema?: Record<string, unknown>;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Generated schema validation failed at path '${schemaPath}': ${validationError}`,
      reassure: "Schema validation errors indicate the generated schema needs adjustments to conform to AsyncAPI specification.",
      why: "The generated AsyncAPI schema contains elements that don't meet the AsyncAPI 3.0 specification requirements.",
      fix: [
        "Review the TypeSpec definition for AsyncAPI compatibility",
        "Use AsyncAPI-compatible data types and patterns",
        "Add required properties and remove invalid ones",
        "Check AsyncAPI 3.0 specification for schema requirements"
      ],
      escape: correctedSchema 
        ? "Will use corrected schema that conforms to AsyncAPI specification"
        : "Will omit the invalid schema elements and add validation warnings",
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: correctedSchema ? "fallback" : "degrade",
      canRecover: true,
      recoveryHint: correctedSchema ? "Using corrected schema" : "Omitting invalid elements",
      additionalData: { schemaPath, validationError, correctedSchema }
    });
  }
}

/**
 * Complex type simplification warning
 */
export class TypeSimplificationWarning extends BaseAsyncAPIError {
  readonly _tag = "TypeSimplificationWarning" as const;
  
  constructor({
    typeName,
    complexity,
    simplification,
    operation,
    severity = "info"
  }: {
    typeName: string;
    complexity: string;
    simplification: string;
    operation: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Type '${typeName}' was simplified during schema generation: ${complexity}`,
      reassure: "Type simplification helps ensure AsyncAPI compatibility while preserving core functionality.",
      why: "The original type was too complex for direct AsyncAPI schema representation.",
      fix: [
        "Review the simplified schema to ensure it meets your requirements",
        "Consider restructuring complex types into simpler components",
        "Use composition instead of complex inheritance hierarchies",
        "Add documentation to explain the original intent"
      ],
      escape: `Applied simplification: ${simplification}`,
      severity,
      category: "schema-generation",
      operation,
      recoveryStrategy: "degrade",
      canRecover: true,
      recoveryHint: "Type successfully simplified",
      additionalData: { typeName, complexity, simplification }
    });
  }
}
