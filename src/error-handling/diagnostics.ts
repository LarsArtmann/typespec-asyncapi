import type { Program, Diagnostic, SourceLocation } from "@typespec/compiler";
import type { $lib } from "../lib.js";
import { reportDiagnostic } from "../lib.js";
import type { ErrorContext, ErrorSeverity } from "./index.js";
import { formatRecommendations, formatReportHeader } from "../utils/formatting.js";

/**
 * TYPESPEC DIAGNOSTIC INTEGRATION
 * 
 * Bridges comprehensive error handling with TypeSpec's diagnostic system
 * Provides seamless integration between custom error contexts and TypeSpec diagnostics
 */

// ==========================================
// DIAGNOSTIC CONVERSION UTILITIES
// ==========================================

/**
 * Convert ErrorContext to TypeSpec diagnostic and report it
 */
export function reportErrorContext(program: Program, errorContext: ErrorContext): void {
  const diagnosticCode = mapErrorCategoryToDiagnosticCode(errorContext.category);
  
  // Create comprehensive diagnostic message following What/Reassure/Why/Fix/Escape pattern
  // Note: Message is formatted in the diagnostic format parameter, not used directly
  
  reportDiagnostic(program, {
    code: diagnosticCode as keyof typeof $lib.diagnostics,
    target: errorContext.target || program.getGlobalNamespaceType(),
    format: {
      errorId: errorContext.errorId,
      what: errorContext.what,
      why: errorContext.why,
      fix: errorContext.fix.join("\n  • "),
      escape: errorContext.escape,
      reassure: errorContext.reassure
    },
    messageId: "default"
  });
  
  // Log additional debug information if available
  if (errorContext.stackTrace && program.host.logSink) {
    program.host.logSink.log({
      level: "trace" as const,
      message: `Stack trace for ${errorContext.errorId}: ${errorContext.stackTrace}`
    });
  }
  
  // Report related errors if any
  if (errorContext.relatedErrors) {
    for (const relatedError of errorContext.relatedErrors) {
      reportErrorContext(program, relatedError);
    }
  }
}

/**
 * Map error category to appropriate TypeSpec diagnostic code
 */
function mapErrorCategoryToDiagnosticCode(category: string): string {
  switch (category) {
    case "validation":
      return "invalid-channel-path"; // Reuse existing code for validation
    case "schema-generation":
      return "missing-message-schema";
    case "compilation":
      return "invalid-asyncapi-version";
    case "configuration":
      return "missing-server-config";
    case "file-system":
    case "memory":
    case "network":
      return "unsupported-protocol"; // Generic infrastructure error
    case "security":
      return "invalid-security-scheme";
    default:
      return "invalid-channel-path"; // Fallback to generic error
  }
}

// formatDiagnosticMessage function removed as unused

/**
 * Convert TypeSpec diagnostic severity to our error severity
 */
export function mapDiagnosticSeverity(severity: "error" | "warning" | "info"): ErrorSeverity {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "info";
    default:
      return "error";
  }
}

/**
 * Extract source location information from TypeSpec diagnostic
 */
export function extractSourceLocation(diagnostic: Diagnostic): SourceLocation | undefined {
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

// ==========================================
// DIAGNOSTIC COLLECTION AND ANALYSIS
// ==========================================

/**
 * Collect and analyze all diagnostics from a program
 */
export type DiagnosticAnalysis = {
  readonly total: number;
  readonly byCategory: Record<ErrorSeverity, number>;
  readonly fatal: boolean; // True if any fatal errors exist
  readonly canContinue: boolean; // True if processing can continue
  readonly recommendations: string[];
}

/**
 * Analyze diagnostics and provide comprehensive summary
 */
export function analyzeDiagnostics(diagnostics: readonly Diagnostic[]): DiagnosticAnalysis {
  const byCategory: Record<ErrorSeverity, number> = {
    fatal: 0,
    error: 0,
    warning: 0,
    info: 0,
    debug: 0
  };
  
  let fatal = false;
  const recommendations: string[] = [];
  
  for (const diagnostic of diagnostics) {
    const severity = mapDiagnosticSeverity(diagnostic.severity);
    byCategory[severity]++;
    
    if (severity === "error") {
      fatal = true;
    }
    
    // Add category-specific recommendations
    if (diagnostic.code === "missing-channel-path") {
      recommendations.push("Add @channel decorator to operations that publish or subscribe to messages");
    } else if (diagnostic.code === "missing-message-schema") {
      recommendations.push("Define TypeSpec models for message payloads");
    } else if (diagnostic.code === "conflicting-operation-type") {
      recommendations.push("Remove duplicate @publish/@subscribe decorators from operations");
    }
  }
  
  // Add general recommendations based on error patterns
  if (byCategory.error > 5) {
    recommendations.push("Consider breaking large TypeSpec files into smaller modules");
  }
  
  if (byCategory.warning > 10) {
    recommendations.push("Review warnings to improve code quality and AsyncAPI compatibility");
  }
  
  // Remove duplicates
  const uniqueRecommendations = [...new Set(recommendations)];
  
  return {
    total: diagnostics.length,
    byCategory,
    fatal,
    canContinue: !fatal && byCategory.error === 0,
    recommendations: uniqueRecommendations
  };
}

/**
 * Generate diagnostic summary report
 */
export function generateDiagnosticReport(analysis: DiagnosticAnalysis): string {
  const sections = [];
  
  sections.push(...formatReportHeader("📊 DIAGNOSTIC ANALYSIS REPORT"));
  
  // Summary statistics
  sections.push(`Total Issues: ${analysis.total}`);
  sections.push(`• Errors: ${analysis.byCategory.error}`);
  sections.push(`• Warnings: ${analysis.byCategory.warning}`);
  sections.push(`• Info: ${analysis.byCategory.info}`);
  
  // Status assessment
  if (analysis.fatal) {
    sections.push("");
    sections.push("🚨 FATAL ERRORS DETECTED");
    sections.push("Processing cannot continue until errors are resolved.");
  } else if (analysis.canContinue) {
    sections.push("");
    sections.push("✅ PROCESSING CAN CONTINUE");
    sections.push("No fatal errors detected.");
  } else {
    sections.push("");
    sections.push("⚠️  ERRORS REQUIRE ATTENTION");
    sections.push("Fix errors before generating AsyncAPI specification.");
  }
  
  // Recommendations
  sections.push(...formatRecommendations(analysis.recommendations));
  
  return sections.join("\n");
}

// ==========================================
// ERROR AGGREGATION
// ==========================================

/**
 * Aggregate multiple error contexts into a summary
 */
export type ErrorSummary = {
  readonly totalErrors: number;
  readonly errorsByCategory: Record<string, number>;
  readonly criticalErrors: ErrorContext[];
  readonly recoverableErrors: ErrorContext[];
  readonly canProceed: boolean;
  readonly nextSteps: string[];
}

/**
 * Create error summary from multiple error contexts
 */
export function createErrorSummary(errors: ErrorContext[]): ErrorSummary {
  const errorsByCategory: Record<string, number> = {};
  const criticalErrors: ErrorContext[] = [];
  const recoverableErrors: ErrorContext[] = [];
  const nextSteps: string[] = [];
  
  for (const error of errors) {
    // Count by category
    errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    
    // Categorize by recoverability
    if (error.canRecover) {
      recoverableErrors.push(error);
    } else {
      criticalErrors.push(error);
    }
    
    // Collect unique next steps
    error.fix.forEach(step => {
      if (!nextSteps.includes(step)) {
        nextSteps.push(step);
      }
    });
  }
  
  const canProceed = criticalErrors.length === 0;
  
  // Add summary-level next steps
  if (!canProceed) {
    nextSteps.unshift("Fix critical errors before proceeding");
  } else if (recoverableErrors.length > 0) {
    nextSteps.unshift("Review recoverable errors for optimal results");
  }
  
  return {
    totalErrors: errors.length,
    errorsByCategory,
    criticalErrors,
    recoverableErrors,
    canProceed,
    nextSteps: nextSteps.slice(0, 10) // Limit to top 10 steps
  };
}

/**
 * Generate error summary report
 */
export function generateErrorSummaryReport(summary: ErrorSummary): string {
  const sections = [];
  
  sections.push("📋 ERROR SUMMARY REPORT");
  sections.push("=" .repeat(40));
  
  // Overall status
  if (summary.canProceed) {
    sections.push("✅ Status: CAN PROCEED");
  } else {
    sections.push("🚨 Status: BLOCKED - CRITICAL ERRORS");
  }
  
  sections.push(`Total Errors: ${summary.totalErrors}`);
  sections.push(`Critical: ${summary.criticalErrors.length}`);
  sections.push(`Recoverable: ${summary.recoverableErrors.length}`);
  
  // Error breakdown by category
  if (Object.keys(summary.errorsByCategory).length > 0) {
    sections.push("");
    sections.push("📊 Errors by Category:");
    Object.entries(summary.errorsByCategory)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .forEach(([category, count]) => {
        sections.push(`  • ${category}: ${count}`);
      });
  }
  
  // Next steps
  if (summary.nextSteps.length > 0) {
    sections.push("");
    sections.push("🔧 Next Steps:");
    summary.nextSteps.forEach((step, index) => {
      sections.push(`  ${index + 1}. ${step}`);
    });
  }
  
  sections.push("");
  sections.push("=" .repeat(40));
  
  return sections.join("\n");
}
