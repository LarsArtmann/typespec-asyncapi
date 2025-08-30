/**
 * FILE SYSTEM ERROR CLASSES
 * 
 * Handles file I/O errors, path resolution errors, permission errors,
 * and disk space issues with comprehensive recovery strategies
 */

import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";

/**
 * File system operation error with recovery strategies
 */
export class FileSystemError extends BaseAsyncAPIError {
  readonly _tag = "FileSystemError" as const;
  
  constructor({
    path,
    operation,
    originalError,
    fallbackPath,
    severity = "error"
  }: {
    path: string;
    operation: string;
    originalError: Error;
    fallbackPath?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `File system operation '${operation}' failed for path: ${path}`,
      reassure: "File system errors are often temporary and can be resolved.",
      why: `System error: ${originalError.message}`,
      fix: [
        "Check if the file/directory exists and is accessible",
        "Verify permissions for the target location",
        "Ensure sufficient disk space is available",
        "Check if the path contains invalid characters"
      ],
      escape: fallbackPath 
        ? `Will attempt to use fallback location: ${fallbackPath}`
        : "Output will be stored in memory temporarily",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: fallbackPath ? "fallback" : "cache",
      canRecover: true,
      recoveryHint: fallbackPath ? `Fallback: ${fallbackPath}` : "Memory storage",
      additionalData: { path, originalError: originalError.message, fallbackPath },
      causedBy: originalError instanceof BaseAsyncAPIError ? originalError : undefined
    });
  }
}

/**
 * File not found error with path suggestions
 */
export class FileNotFoundError extends BaseAsyncAPIError {
  readonly _tag = "FileNotFoundError" as const;
  
  constructor({
    path,
    operation,
    suggestedPaths,
    canCreate,
    severity = "error"
  }: {
    path: string;
    operation: string;
    suggestedPaths?: string[];
    canCreate?: boolean;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `File not found: ${path}`,
      reassure: "File not found errors can be resolved by correcting the path or creating the missing file.",
      why: "The specified file path does not exist on the file system.",
      fix: [
        "Check that the file path is correct",
        "Verify the file exists at the specified location",
        suggestedPaths ? `Try one of these paths: ${suggestedPaths.join(', ')}` : "Check for typos in the file path",
        canCreate ? "Create the missing file" : "Ensure the file has been created"
      ],
      escape: canCreate 
        ? "Will create the file with default content"
        : "Operation will be skipped for this file",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: canCreate ? "default" : "skip",
      canRecover: true,
      recoveryHint: canCreate ? "Will create with defaults" : "File will be skipped",
      additionalData: { path, suggestedPaths, canCreate }
    });
  }
}

/**
 * Permission denied error with guidance
 */
export class PermissionDeniedError extends BaseAsyncAPIError {
  readonly _tag = "PermissionDeniedError" as const;
  
  constructor({
    path,
    operation,
    requiredPermissions,
    tempPath,
    severity = "error"
  }: {
    path: string;
    operation: string;
    requiredPermissions: string[];
    tempPath?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Permission denied for ${operation} operation on: ${path}`,
      reassure: "Permission errors can be resolved by adjusting file permissions or using an alternative location.",
      why: `The current user does not have sufficient permissions for this operation.`,
      fix: [
        `Grant ${requiredPermissions.join(', ')} permissions to the file/directory`,
        "Run the operation with elevated privileges if appropriate",
        "Choose a different output location with write permissions",
        "Check the file ownership and group permissions"
      ],
      escape: tempPath 
        ? `Will use temporary location: ${tempPath}`
        : "Will store output in system temporary directory",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: "fallback",
      canRecover: true,
      recoveryHint: tempPath ? `Using temp path: ${tempPath}` : "Using system temp directory",
      additionalData: { path, requiredPermissions, tempPath }
    });
  }
}

/**
 * Disk space error with cleanup suggestions
 */
export class DiskSpaceError extends BaseAsyncAPIError {
  readonly _tag = "DiskSpaceError" as const;
  
  constructor({
    path,
    operation,
    requiredSpace,
    availableSpace,
    alternatePath,
    severity = "error"
  }: {
    path: string;
    operation: string;
    requiredSpace: number;
    availableSpace: number;
    alternatePath?: string;
    severity?: ErrorSeverity;
  }) {
    const requiredMB = Math.round(requiredSpace / 1024 / 1024);
    const availableMB = Math.round(availableSpace / 1024 / 1024);
    const shortfallMB = requiredMB - availableMB;
    
    super({
      what: `Insufficient disk space for ${operation} at ${path}. Required: ${requiredMB}MB, Available: ${availableMB}MB`,
      reassure: "Disk space errors can be resolved by freeing up space or using an alternative location.",
      why: `The operation requires ${shortfallMB}MB more disk space than is currently available.`,
      fix: [
        `Free up at least ${shortfallMB}MB of disk space`,
        "Delete temporary files and clean up old data",
        "Choose a different output location with more space",
        "Use streaming mode to reduce memory footprint if available"
      ],
      escape: alternatePath 
        ? `Will try alternative location: ${alternatePath}`
        : "Will use compressed output format to reduce space requirements",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: alternatePath ? "fallback" : "degrade",
      canRecover: true,
      recoveryHint: alternatePath ? `Alternative path: ${alternatePath}` : "Using compression",
      additionalData: { path, requiredSpace, availableSpace, shortfallMB, alternatePath }
    });
  }
}

/**
 * Path validation error for invalid characters or structure
 */
export class InvalidPathError extends BaseAsyncAPIError {
  readonly _tag = "InvalidPathError" as const;
  
  constructor({
    path,
    operation,
    pathIssue,
    sanitizedPath,
    severity = "warning"
  }: {
    path: string;
    operation: string;
    pathIssue: string;
    sanitizedPath?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Invalid path '${path}': ${pathIssue}`,
      reassure: "Invalid path errors can be resolved by using valid file system characters and structure.",
      why: "The specified path contains characters or patterns not supported by the file system.",
      fix: [
        "Remove or replace invalid characters in the path",
        "Ensure the path follows file system naming conventions",
        "Avoid reserved names and special characters",
        "Use forward slashes for cross-platform compatibility"
      ],
      escape: sanitizedPath 
        ? `Will use sanitized path: ${sanitizedPath}`
        : "Will generate a safe alternative path automatically",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: "fallback",
      canRecover: true,
      recoveryHint: sanitizedPath ? `Sanitized: ${sanitizedPath}` : "Auto-generating safe path",
      additionalData: { path, pathIssue, sanitizedPath }
    });
  }
}

/**
 * File lock error when file is in use by another process
 */
export class FileLockError extends BaseAsyncAPIError {
  readonly _tag = "FileLockError" as const;
  
  constructor({
    path,
    operation,
    lockingProcess,
    tempPath,
    severity = "warning"
  }: {
    path: string;
    operation: string;
    lockingProcess?: string;
    tempPath?: string;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `File is locked by another process: ${path}${lockingProcess ? ` (${lockingProcess})` : ''}`,
      reassure: "File lock errors are temporary and can be resolved by waiting or using an alternative approach.",
      why: "The file is currently being used by another process and cannot be accessed.",
      fix: [
        "Close the application that is using the file",
        "Wait for the other process to release the file lock",
        "Use a different output file name",
        "Check task manager for processes that might be holding the file"
      ],
      escape: tempPath 
        ? `Will write to temporary file: ${tempPath}`
        : "Will retry the operation with a brief delay",
      severity,
      category: "file-system",
      operation,
      recoveryStrategy: tempPath ? "fallback" : "retry",
      canRecover: true,
      recoveryHint: tempPath ? `Temp file: ${tempPath}` : "Will retry in 1 second",
      additionalData: { path, lockingProcess, tempPath }
    });
  }
}
