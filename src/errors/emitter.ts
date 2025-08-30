/**
 * EMITTER-SPECIFIC ERROR CLASSES
 * 
 * Handles AsyncAPI emitter initialization errors, configuration errors,
 * and emitter operation failures with recovery strategies
 */

import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";
import type { AsyncAPIEmitterOptions } from "../types/options.js";

/**
 * Emitter initialization error
 */
export class EmitterInitializationError extends BaseAsyncAPIError {
  readonly _tag = "EmitterInitializationError" as const;
  
  constructor({
    component,
    issue,
    operation,
    fallbackMode,
    severity = "error"
  }: {
    component: string;
    issue: string;
    operation: string;
    fallbackMode?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Failed to initialize ${component} during emitter setup: ${issue}`,
      reassure: "Emitter initialization errors can usually be resolved by fixing configuration or dependencies.",
      why: `The ${component} component could not be properly initialized.`,
      fix: [
        "Check the emitter configuration for correct values",
        "Verify all required dependencies are installed",
        "Ensure the TypeSpec program is valid",
        "Check for conflicting emitter options"
      ],
      escape: fallbackMode 
        ? `Will run in fallback mode: ${fallbackMode}`
        : "Emitter will terminate to prevent generating invalid output",
      severity,
      category: "emitter",
      operation,
      recoveryStrategy: fallbackMode ? "fallback" : "abort",
      canRecover: !!fallbackMode,
      ...(fallbackMode && { recoveryHint: fallbackMode }),
      additionalData: { component, issue, fallbackMode }
    });
  }
}

/**
 * Emitter configuration error for invalid options
 */
export class EmitterConfigurationError extends BaseAsyncAPIError {
  readonly _tag = "EmitterConfigurationError" as const;
  
  constructor({
    optionName,
    providedValue,
    expectedType,
    operation,
    defaultValue,
    severity = "error"
  }: {
    optionName: keyof AsyncAPIEmitterOptions;
    providedValue: unknown;
    expectedType: string;
    operation: string;
    defaultValue?: unknown;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Invalid emitter option '${String(optionName)}': expected ${expectedType}, got ${typeof providedValue}`,
      reassure: "Configuration errors can be quickly resolved by providing valid option values.",
      why: `The emitter option '${String(optionName)}' was provided with an invalid value or type.`,
      fix: [
        `Set '${String(optionName)}' to a valid ${expectedType} value`,
        "Check the AsyncAPI emitter documentation for valid options",
        "Review your TypeSpec configuration file",
        "Verify the option syntax and formatting"
      ],
      escape: defaultValue !== undefined 
        ? `Will use default value: ${JSON.stringify(defaultValue)}`
        : "Will skip this option and use system defaults",
      severity,
      category: "configuration",
      operation,
      recoveryStrategy: defaultValue !== undefined ? "default" : "skip",
      canRecover: true,
      recoveryHint: defaultValue !== undefined ? `Default: ${JSON.stringify(defaultValue)}` : "Using system defaults",
      additionalData: { optionName: String(optionName), providedValue, expectedType, defaultValue }
    });
  }
}

/**
 * Output generation error
 */
export class OutputGenerationError extends BaseAsyncAPIError {
  readonly _tag = "OutputGenerationError" as const;
  
  constructor({
    outputType,
    issue,
    operation,
    partialOutput,
    severity = "error"
  }: {
    outputType: string;
    issue: string;
    operation: string;
    partialOutput?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Failed to generate ${outputType} output: ${issue}`,
      reassure: "Output generation errors can often be resolved by adjusting the input or output format.",
      why: `An error occurred while generating the ${outputType} format output.`,
      fix: [
        "Check the TypeSpec definitions for AsyncAPI compatibility",
        "Verify the output format configuration",
        "Ensure all required properties are defined",
        "Try generating a different output format to isolate the issue"
      ],
      escape: partialOutput 
        ? "Will save partial output with error annotations"
        : "Will terminate generation to prevent corrupted output",
      severity,
      category: "emitter",
      operation,
      recoveryStrategy: partialOutput ? "degrade" : "abort",
      canRecover: !!partialOutput,
      ...(partialOutput && { recoveryHint: "Partial output will be saved" }),
      additionalData: { outputType, issue, partialOutput }
    });
  }
}

/**
 * AsyncAPI version compatibility error
 */
export class VersionCompatibilityError extends BaseAsyncAPIError {
  readonly _tag = "VersionCompatibilityError" as const;
  
  constructor({
    targetVersion,
    feature,
    operation,
    alternativeApproach,
    severity = "warning"
  }: {
    targetVersion: string;
    feature: string;
    operation: string;
    alternativeApproach?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Feature '${feature}' is not supported in AsyncAPI ${targetVersion}`,
      reassure: "Version compatibility issues can be resolved by using alternative approaches or updating the target version.",
      why: `The TypeSpec definition uses features that are not available in the target AsyncAPI version.`,
      fix: [
        alternativeApproach || "Use AsyncAPI version-compatible alternatives",
        `Upgrade target version to support ${feature}`,
        "Review AsyncAPI version compatibility documentation",
        "Consider using extension properties for unsupported features"
      ],
      escape: alternativeApproach 
        ? `Will use alternative approach: ${alternativeApproach}`
        : "Will omit the unsupported feature with a compatibility note",
      severity,
      category: "emitter",
      operation,
      recoveryStrategy: alternativeApproach ? "fallback" : "skip",
      canRecover: true,
      recoveryHint: alternativeApproach || "Feature will be omitted",
      additionalData: { targetVersion, feature, alternativeApproach }
    });
  }
}

/**
 * Decorator processing error
 */
export class DecoratorProcessingError extends BaseAsyncAPIError {
  readonly _tag = "DecoratorProcessingError" as const;
  
  constructor({
    decoratorName,
    targetName,
    processingIssue,
    operation,
    skipDecorator,
    severity = "error"
  }: {
    decoratorName: string;
    targetName: string;
    processingIssue: string;
    operation: string;
    skipDecorator?: boolean;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Error processing @${decoratorName} decorator on '${targetName}': ${processingIssue}`,
      reassure: "Decorator processing errors can be resolved by correcting the decorator usage or configuration.",
      why: `The @${decoratorName} decorator could not be processed correctly.`,
      fix: [
        "Check the decorator parameters and usage",
        "Verify the decorator is applied to the correct TypeSpec construct",
        "Ensure all required decorator arguments are provided",
        "Review the AsyncAPI emitter decorator documentation"
      ],
      escape: skipDecorator 
        ? "Will skip this decorator and continue processing"
        : "Will use default behavior for this element",
      severity,
      category: "emitter",
      operation,
      recoveryStrategy: "skip",
      canRecover: true,
      recoveryHint: "Decorator will be skipped",
      additionalData: { decoratorName, targetName, processingIssue, skipDecorator }
    });
  }
}

/**
 * Protocol binding error
 */
export class ProtocolBindingError extends BaseAsyncAPIError {
  readonly _tag = "ProtocolBindingError" as const;
  
  constructor({
    protocol,
    bindingIssue,
    operation,
    fallbackBinding,
    severity = "warning"
  }: {
    protocol: string;
    bindingIssue: string;
    operation: string;
    fallbackBinding?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Protocol binding error for ${protocol}: ${bindingIssue}`,
      reassure: "Protocol binding errors can be resolved by correcting the binding configuration or using alternatives.",
      why: `The ${protocol} protocol binding configuration contains errors or unsupported features.`,
      fix: [
        "Check the protocol binding configuration syntax",
        "Verify the protocol-specific parameters are correct",
        "Ensure the protocol version is supported",
        "Review the AsyncAPI protocol bindings documentation"
      ],
      escape: fallbackBinding 
        ? `Will use fallback binding: ${fallbackBinding}`
        : "Will omit protocol-specific bindings and use generic message patterns",
      severity,
      category: "emitter",
      operation,
      recoveryStrategy: fallbackBinding ? "fallback" : "skip",
      canRecover: true,
      recoveryHint: fallbackBinding ? `Fallback: ${fallbackBinding}` : "Using generic patterns",
      additionalData: { protocol, bindingIssue, fallbackBinding }
    });
  }
}
