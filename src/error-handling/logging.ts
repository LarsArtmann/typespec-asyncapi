import type { Program } from "@typespec/compiler";
import type { ErrorContext, ErrorSeverity } from "./index.js";
import { formatRecommendations, formatReportHeader } from "../utils/formatting.js";

/**
 * STRUCTURED ERROR LOGGING SYSTEM
 * 
 * Provides comprehensive error logging with structured context
 * Supports multiple log levels, filtering, and formatting options
 */

// ==========================================
// LOGGING INTERFACES
// ==========================================

/**
 * Log entry structure
 */
export interface LogEntry {
  readonly timestamp: Date;
  readonly level: ErrorSeverity;
  readonly message: string;
  readonly errorId?: string | undefined;
  readonly category?: string | undefined;
  readonly operation?: string | undefined;
  readonly context?: Record<string, unknown> | undefined;
  readonly stackTrace?: string | undefined;
}

/**
 * Logger interface
 */
export interface ErrorLogger {
  log(entry: LogEntry): void;
  logError(error: ErrorContext): void;
  flush(): Promise<void>;
  setLevel(level: ErrorSeverity): void;
  getEntries(): readonly LogEntry[];
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  readonly level: ErrorSeverity;
  readonly includeStackTrace: boolean;
  readonly includeContext: boolean;
  readonly maxEntries: number;
  readonly timestampFormat: "iso" | "timestamp" | "relative";
  readonly colorize: boolean;
  readonly outputFormat: "json" | "text" | "structured";
}

// ==========================================
// DEFAULT LOGGER IMPLEMENTATION
// ==========================================

/**
 * Default console logger implementation
 */
export class ConsoleErrorLogger implements ErrorLogger {
  private entries: LogEntry[] = [];
  private config: LoggingConfig;
  
  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      level: "warning",
      includeStackTrace: true,
      includeContext: true,
      maxEntries: 1000,
      timestampFormat: "iso",
      colorize: true,
      outputFormat: "structured",
      ...config
    };
  }
  
  log(entry: LogEntry): void {
    // Filter by log level
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    // Store entry
    this.entries.push(entry);
    
    // Trim entries if over limit
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }
    
    // Output to console
    this.outputToConsole(entry);
  }
  
  logError(error: ErrorContext): void {
    const entry: LogEntry = {
      timestamp: error.timestamp,
      level: error.severity,
      message: this.formatErrorMessage(error),
      errorId: error.errorId,
      category: error.category,
      operation: error.operation,
      context: this.config.includeContext ? {
        what: error.what,
        why: error.why,
        fix: error.fix,
        escape: error.escape,
        canRecover: error.canRecover,
        recoveryStrategy: error.recoveryStrategy,
        ...error.additionalData
      } : undefined,
      stackTrace: (this.config.includeStackTrace && error.stackTrace) ? error.stackTrace : undefined
    };
    
    this.log(entry);
  }
  
  async flush(): Promise<void> {
    // Console logger flushes immediately, no-op
  }
  
  setLevel(level: ErrorSeverity): void {
    this.config = { ...this.config, level };
  }
  
  getEntries(): readonly LogEntry[] {
    return [...this.entries];
  }
  
  private shouldLog(level: ErrorSeverity): boolean {
    const levels: Record<ErrorSeverity, number> = {
      debug: 0,
      info: 1,
      warning: 2,
      error: 3,
      fatal: 4
    };
    
    return levels[level] >= levels[this.config.level];
  }
  
  private formatErrorMessage(error: ErrorContext): string {
    switch (this.config.outputFormat) {
      case "json":
        return JSON.stringify({
          errorId: error.errorId,
          what: error.what,
          category: error.category,
          operation: error.operation
        });
        
      case "text":
        return `[${error.errorId}] ${error.what}`;
        
      case "structured":
      default:
        return `${error.what} (ID: ${error.errorId}, Category: ${error.category})`;
    }
  }
  
  private outputToConsole(entry: LogEntry): void {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const message = entry.message;
    
    let output = `${timestamp} ${level} ${message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2).replace(/\n/g, '\n  ')}`;
    }
    
    if (entry.stackTrace) {
      output += `\n  Stack: ${entry.stackTrace.replace(/\n/g, '\n  ')}`;
    }
    
    // Output to appropriate console method based on level
    switch (entry.level) {
      case "fatal":
      case "error":
        console.error(output);
        break;
      case "warning":
        console.warn(output);
        break;
      case "info":
        console.info(output);
        break;
      case "debug":
      default:
        console.log(output);
        break;
    }
  }
  
  private formatTimestamp(timestamp: Date): string {
    switch (this.config.timestampFormat) {
      case "timestamp":
        return timestamp.getTime().toString();
      case "relative":
        const diff = Date.now() - timestamp.getTime();
        return `+${diff}ms`;
      case "iso":
      default:
        return timestamp.toISOString();
    }
  }
  
  private formatLevel(level: ErrorSeverity): string {
    const levels = {
      fatal: "💥 FATAL",
      error: "❌ ERROR",
      warning: "⚠️  WARN ",
      info: "ℹ️  INFO ",
      debug: "🔍 DEBUG"
    };
    
    let formatted = levels[level] || level.toUpperCase();
    
    if (this.config.colorize) {
      const colors = {
        fatal: "\x1b[41m", // Red background
        error: "\x1b[31m", // Red
        warning: "\x1b[33m", // Yellow
        info: "\x1b[36m", // Cyan
        debug: "\x1b[37m" // White
      };
      
      const reset = "\x1b[0m";
      formatted = `${colors[level] || ""}${formatted}${reset}`;
    }
    
    return formatted;
  }
}

// ==========================================
// TYPESPEC HOST LOGGER ADAPTER
// ==========================================

/**
 * Adapter to use TypeSpec program host logging
 */
export class TypeSpecHostLogger implements ErrorLogger {
  private program: Program;
  private fallbackLogger: ErrorLogger;
  private entries: LogEntry[] = [];
  
  constructor(program: Program, fallbackConfig?: Partial<LoggingConfig>) {
    this.program = program;
    this.fallbackLogger = new ConsoleErrorLogger(fallbackConfig);
  }
  
  log(entry: LogEntry): void {
    // Store entry
    this.entries.push(entry);
    
    // Try to use host logger first
    if (this.program.host?.logSink) {
      this.program.host.logSink.log({
        level: this.mapSeverityToHostLevel(entry.level),
        message: entry.message
      });
    } else {
      // Fallback to console logger
      this.fallbackLogger.log(entry);
    }
  }
  
  logError(error: ErrorContext): void {
    const entry: LogEntry = {
      timestamp: error.timestamp,
      level: error.severity,
      message: `[${error.errorId}] ${error.what}`,
      errorId: error.errorId,
      category: error.category,
      operation: error.operation,
      context: {
        what: error.what,
        why: error.why,
        fix: error.fix,
        escape: error.escape,
        ...error.additionalData
      },
      stackTrace: error.stackTrace
    };
    
    this.log(entry);
  }
  
  async flush(): Promise<void> {
    await this.fallbackLogger.flush();
  }
  
  setLevel(level: ErrorSeverity): void {
    this.fallbackLogger.setLevel(level);
  }
  
  getEntries(): readonly LogEntry[] {
    return [...this.entries];
  }
  
  private mapSeverityToHostLevel(severity: ErrorSeverity): "trace" | "warning" | "error" {
    switch (severity) {
      case "debug":
      case "info":
        return "trace";
      case "warning":
        return "warning";
      case "error":
      case "fatal":
        return "error";
      default:
        return "error";
    }
  }
}

// ==========================================
// LOGGING UTILITIES
// ==========================================

/**
 * Global logger instance (can be replaced)
 */
let globalLogger: ErrorLogger = new ConsoleErrorLogger();

/**
 * Set global logger instance
 */
export function setGlobalLogger(logger: ErrorLogger): void {
  globalLogger = logger;
}

/**
 * Get current global logger
 */
export function getGlobalLogger(): ErrorLogger {
  return globalLogger;
}

/**
 * Log error context using global logger
 */
export function logError(error: ErrorContext): void {
  globalLogger.logError(error);
}

/**
 * Log message using global logger
 */
export function log(level: ErrorSeverity, message: string, context?: Record<string, unknown>): void {
  globalLogger.log({
    timestamp: new Date(),
    level,
    message,
    errorId: undefined,
    category: undefined,
    operation: undefined,
    context: context || undefined,
    stackTrace: undefined
  });
}

/**
 * Create logger from TypeSpec program
 */
export function createLoggerFromProgram(program: Program, config?: Partial<LoggingConfig>): ErrorLogger {
  return new TypeSpecHostLogger(program, config);
}

/**
 * Generate log analysis report
 */
export interface LogAnalysis {
  readonly totalEntries: number;
  readonly byLevel: Record<ErrorSeverity, number>;
  readonly byCategory: Record<string, number>;
  readonly timeRange: { start: Date; end: Date } | null;
  readonly topErrors: Array<{ errorId: string; count: number; lastSeen: Date }>;
  readonly recommendations: string[];
}

/**
 * Analyze log entries for patterns and issues
 */
/**
 * Count log entries by severity level
 */
function countEntriesByLevel(entries: readonly LogEntry[]): Record<ErrorSeverity, number> {
  const byLevel: Record<ErrorSeverity, number> = {
    fatal: 0,
    error: 0,
    warning: 0,
    info: 0,
    debug: 0
  };
  
  for (const entry of entries) {
    byLevel[entry.level]++;
  }
  
  return byLevel;
}

/**
 * Count log entries by category
 */
function countEntriesByCategory(entries: readonly LogEntry[]): Record<string, number> {
  const byCategory: Record<string, number> = {};
  
  for (const entry of entries) {
    if (entry.category) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    }
  }
  
  return byCategory;
}

/**
 * Track error frequency and timing
 */
function trackErrorFrequency(entries: readonly LogEntry[]): Array<{ errorId: string; count: number; lastSeen: Date }> {
  const errorCounts = new Map<string, { count: number; lastSeen: Date }>();
  
  for (const entry of entries) {
    if (entry.errorId) {
      const existing = errorCounts.get(entry.errorId);
      errorCounts.set(entry.errorId, {
        count: (existing?.count || 0) + 1,
        lastSeen: entry.timestamp
      });
    }
  }
  
  return Array.from(errorCounts.entries())
    .map(([errorId, data]) => ({ errorId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Calculate time range from log entries
 */
function calculateTimeRange(entries: readonly LogEntry[]): { start: Date; end: Date } | null {
  if (entries.length === 0) return null;
  
  let earliest = entries[0]!.timestamp;
  let latest = entries[0]!.timestamp;
  
  for (const entry of entries) {
    if (entry.timestamp < earliest) earliest = entry.timestamp;
    if (entry.timestamp > latest) latest = entry.timestamp;
  }
  
  return { start: earliest, end: latest };
}

/**
 * Generate analysis recommendations based on log patterns
 */
function generateLogRecommendations(
  byLevel: Record<ErrorSeverity, number>,
  byCategory: Record<string, number>,
  topErrors: Array<{ errorId: string; count: number; lastSeen: Date }>,
  totalEntries: number
): string[] {
  const recommendations: string[] = [];
  
  if (byLevel.fatal > 0) {
    recommendations.push("Address fatal errors immediately to prevent system instability");
  }
  
  if (byLevel.error > byLevel.warning * 2) {
    recommendations.push("High error rate detected - review input validation and error handling");
  }
  
  if (topErrors.some(e => e.count > 5)) {
    recommendations.push("Recurring errors detected - investigate root causes to prevent repetition");
  }
  
  const categoryEntries = Object.entries(byCategory);
  if (categoryEntries.length > 0) {
    const topCategory = categoryEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    if (topCategory[1] > totalEntries * 0.3) {
      recommendations.push(`High frequency of '${topCategory[0]}' errors - focus improvement efforts here`);
    }
  }
  
  return recommendations;
}

export function analyzeLogEntries(entries: readonly LogEntry[]): LogAnalysis {
  const byLevel = countEntriesByLevel(entries);
  const byCategory = countEntriesByCategory(entries);
  const topErrors = trackErrorFrequency(entries);
  const timeRange = calculateTimeRange(entries);
  const recommendations = generateLogRecommendations(byLevel, byCategory, topErrors, entries.length);
  
  return {
    totalEntries: entries.length,
    byLevel,
    byCategory,
    timeRange,
    topErrors,
    recommendations
  };
}

/**
 * Generate log analysis report
 */
export function generateLogReport(analysis: LogAnalysis): string {
  const sections = [];
  
  sections.push(...formatReportHeader("📊 LOG ANALYSIS REPORT"));
  
  // Summary statistics
  sections.push(`Total Log Entries: ${analysis.totalEntries}`);
  
  if (analysis.timeRange) {
    const duration = analysis.timeRange.end.getTime() - analysis.timeRange.start.getTime();
    sections.push(`Time Range: ${analysis.timeRange.start.toISOString()} to ${analysis.timeRange.end.toISOString()}`);
    sections.push(`Duration: ${Math.round(duration / 1000)}s`);
  }
  
  // Breakdown by level
  sections.push("");
  sections.push("📊 Entries by Level:");
  Object.entries(analysis.byLevel)
    .filter(([, count]) => count > 0)
    .forEach(([level, count]) => {
      const percentage = ((count / analysis.totalEntries) * 100).toFixed(1);
      sections.push(`  • ${level}: ${count} (${percentage}%)`);
    });
  
  // Breakdown by category
  if (Object.keys(analysis.byCategory).length > 0) {
    sections.push("");
    sections.push("📋 Entries by Category:");
    Object.entries(analysis.byCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / analysis.totalEntries) * 100).toFixed(1);
        sections.push(`  • ${category}: ${count} (${percentage}%)`);
      });
  }
  
  // Top recurring errors
  if (analysis.topErrors.length > 0) {
    sections.push("");
    sections.push("🔄 Top Recurring Errors:");
    analysis.topErrors
      .slice(0, 5)
      .forEach((error, index) => {
        sections.push(`  ${index + 1}. ${error.errorId}: ${error.count} occurrences (last: ${error.lastSeen.toISOString()})`);
      });
  }
  
  // Recommendations
  sections.push(...formatRecommendations(analysis.recommendations));
  
  return sections.join("\n");
}
