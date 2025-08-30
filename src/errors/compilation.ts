/**
 * TYPESPEC COMPILATION ERROR CLASSES
 * 
 * Handles TypeSpec compilation errors, semantic analysis errors,
 * and syntax errors with clear user guidance
 */

import type { Diagnostic, DiagnosticTarget, SourceLocation } from "@typespec/compiler";
import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";

/**
 * TypeSpec compilation error - for compilation failures
 */
export class TypeSpecCompilationError extends BaseAsyncAPIError {
  readonly _tag = "TypeSpecCompilationError" as const;
  
  constructor({
    diagnostic,
    operation,
    severity
  }: {
    diagnostic: Diagnostic;
    operation: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `TypeSpec compilation failed: ${diagnostic.message}`,
      reassure: "Compilation errors indicate syntax or semantic issues in your TypeSpec files that can be fixed.",
      why: "The TypeSpec compiler found errors that prevent successful processing.",
      fix: [
        "Fix the syntax error in the TypeSpec file",
        "Check for missing imports or dependencies",
        "Verify decorator usage follows TypeSpec conventions",
        "Ensure all referenced types are properly defined"
      ],
      escape: "Compilation will stop to prevent generating invalid output",
      severity: severity || (diagnostic.severity as ErrorSeverity),
      category: "compilation",
      operation,
      recoveryStrategy: "abort",
      canRecover: false,
      additionalData: { 
        diagnosticCode: diagnostic.code,
        diagnosticMessage: diagnostic.message,
        target: diagnostic.target,
        sourceLocation: this.extractSourceLocation(diagnostic)
      }
    });
  }
  
  private extractSourceLocation(diagnostic: Diagnostic): SourceLocation | undefined {
    if (diagnostic.target && typeof diagnostic.target === 'object' && 'pos' in diagnostic.target && 'end' in diagnostic.target) {
      const target = diagnostic.target as any;
      return {
        file: target.pos?.file || target.end?.file,
        pos: target.pos?.pos || 0,
        end: target.end?.pos || 0
      };
    }
    return undefined;
  }
}

/**
 * Syntax error in TypeSpec source code
 */
export class TypeSpecSyntaxError extends BaseAsyncAPIError {
  readonly _tag = "TypeSpecSyntaxError" as const;
  
  constructor({
    filePath,
    line,
    column,
    syntaxIssue,
    operation,
    expectedTokens,
    severity = "error"
  }: {
    filePath: string;
    line?: number;
    column?: number;
    syntaxIssue: string;
    operation: string;
    expectedTokens?: string[];
    severity?: ErrorSeverity;
  }) {
    const locationInfo = line && column ? ` at line ${line}, column ${column}` : "";
    
    super({
      what: `Syntax error in ${filePath}${locationInfo}: ${syntaxIssue}`,
      reassure: "Syntax errors are common and can be quickly fixed by correcting the TypeSpec code.",
      why: "The TypeSpec parser encountered unexpected syntax that it cannot interpret.",
      fix: [
        "Fix the syntax error in the specified location",
        expectedTokens ? `Expected one of: ${expectedTokens.join(', ')}` : "Check TypeSpec syntax documentation",
        "Ensure proper use of TypeSpec keywords and symbols",
        "Verify that all braces, brackets, and parentheses are properly matched"
      ],
      escape: "Compilation will stop at the first syntax error to prevent cascading issues",
      severity,
      category: "compilation",
      operation,
      recoveryStrategy: "abort",
      canRecover: false,
      additionalData: { filePath, line, column, syntaxIssue, expectedTokens }
    });
  }
}

/**
 * Semantic error in TypeSpec (type resolution, decorator validation, etc.)
 */
export class TypeSpecSemanticError extends BaseAsyncAPIError {
  readonly _tag = "TypeSpecSemanticError" as const;
  
  constructor({
    issue,
    context,
    operation,
    target,
    suggestedFixes,
    severity = "error"
  }: {
    issue: string;
    context: string;
    operation: string;
    target?: DiagnosticTarget;
    suggestedFixes?: string[];
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Semantic error: ${issue}`,
      reassure: "Semantic errors indicate logical issues in the TypeSpec model that can be resolved.",
      why: `The issue occurred during ${context} and indicates a problem with type relationships or usage.`,
      fix: suggestedFixes || [
        "Review the type definitions and their relationships",
        "Ensure all referenced types are properly imported",
        "Check decorator usage and parameter types",
        "Verify namespace and scope resolution"
      ],
      escape: "Processing will stop to prevent generating incorrect AsyncAPI specifications",
      severity,
      category: "compilation",
      operation,
      recoveryStrategy: "abort",
      canRecover: false,
      additionalData: { issue, context, target }
    });
  }
}

/**
 * Import resolution error
 */
export class ImportResolutionError extends BaseAsyncAPIError {
  readonly _tag = "ImportResolutionError" as const;
  
  constructor({
    importPath,
    fromFile,
    operation,
    suggestedPaths,
    severity = "error"
  }: {
    importPath: string;
    fromFile: string;
    operation: string;
    suggestedPaths?: string[];
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Cannot resolve import '${importPath}' in file '${fromFile}'`,
      reassure: "Import resolution errors can be fixed by correcting the import path or installing missing dependencies.",
      why: "The TypeSpec compiler cannot locate the specified import.",
      fix: [
        "Check that the import path is correct and the file exists",
        "Ensure the imported package is installed",
        suggestedPaths ? `Try one of these paths: ${suggestedPaths.join(', ')}` : "Verify the relative path from the current file",
        "Check for typos in the import statement"
      ],
      escape: "Compilation will fail until the import is resolved",
      severity,
      category: "compilation",
      operation,
      recoveryStrategy: "abort",
      canRecover: false,
      additionalData: { importPath, fromFile, suggestedPaths }
    });
  }
}

/**
 * Circular dependency error in TypeSpec modules
 */
export class CircularDependencyError extends BaseAsyncAPIError {
  readonly _tag = "CircularDependencyError" as const;
  
  constructor({
    dependencyChain,
    operation,
    severity = "error"
  }: {
    dependencyChain: string[];
    operation: string;
    severity?: ErrorSeverity;
  }) {
    const chainStr = dependencyChain.join(' → ');
    
    super({
      what: `Circular dependency detected: ${chainStr}`,
      reassure: "Circular dependencies can be resolved by restructuring the import relationships.",
      why: "TypeSpec modules form a circular import chain that prevents proper compilation.",
      fix: [
        "Break the circular dependency by moving shared types to a separate module",
        "Use forward declarations where possible",
        "Restructure the module hierarchy to create a dependency tree",
        "Consider using namespace imports instead of specific type imports"
      ],
      escape: "Compilation will fail until the circular dependency is resolved",
      severity,
      category: "compilation",
      operation,
      recoveryStrategy: "abort",
      canRecover: false,
      additionalData: { dependencyChain }
    });
  }
}
