/**
 * Base Discovery Interface
 * 
 * Core interface for TypeSpec file discovery with type safety and extensibility.
 * Provides foundation for all discovery operations with comprehensive error handling.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v0.0.2
 */

import { Effect } from "effect";

/**
 * TypeSpec file information interface
 * Contains basic information about discovered TypeSpec files
 */
export interface TypeSpecFileInfo {
  readonly filePath: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly lastModified: Date;
  readonly contentLength: number;
  readonly fileType: string;
}

/**
 * Discovery options interface
 * Configuration options for file discovery operations
 */
export interface DiscoveryOptions {
  readonly recursive: boolean;
  readonly includeHidden: boolean;
  readonly includeDirectories: boolean;
  readonly filePatterns: string[];
  readonly excludePatterns: string[];
  readonly maxDepth: number;
}

/**
 * Discovery result interface
 * Contains results from file discovery operations
 */
export interface DiscoveryResult {
  readonly files: TypeSpecFileInfo[];
  readonly totalCount: number;
  readonly scannedDirectories: string[];
  readonly scanTime: number;
  readonly options: DiscoveryOptions;
}

/**
 * Discovery metrics interface
 * Performance and usage metrics for discovery operations
 */
export interface DiscoveryMetrics {
  readonly totalFilesFound: number;
  readonly totalDirectoriesScanned: number;
  readonly averageFileSize: number;
  readonly totalFileSize: number;
  readonly scanDuration: number;
  readonly filesPerSecond: number;
  readonly bytesPerSecond: number;
}

/**
 * Base interface for TypeSpec file discovery
 * Provides contract for all discovery operations with type safety
 */
export interface ITypeSpecDiscovery {
  /**
   * Discover TypeSpec files in the specified directory
   * @param rootPath - Root directory to search for TypeSpec files
   * @param options - Discovery configuration options
   * @returns Promise resolving to discovery result
   */
  discoverFiles(rootPath: string, options?: DiscoveryOptions): Effect.Effect<DiscoveryResult, Error>;

  /**
   * Validate if a file is a TypeSpec file
   * @param filePath - Path to file to validate
   * @returns Promise resolving to validation result
   */
  validateFile(filePath: string): Effect.Effect<boolean, Error>;

  /**
   * Extract metadata from TypeSpec file
   * @param fileInfo - File information from discovery
   * @returns Promise resolving to file metadata
   */
  extractMetadata(fileInfo: TypeSpecFileInfo): Effect.Effect<any, Error>;

  /**
   * Get discovery metrics for performance monitoring
   * @returns Promise resolving to discovery metrics
   */
  getMetrics(): Effect.Effect<DiscoveryMetrics, Error>;

  /**
   * Clean up discovery resources
   * @returns Promise resolving to cleanup result
   */
  cleanup(): Effect.Effect<void, Error>;
}

/**
 * Default discovery options
 * Provides sensible defaults for discovery operations
 */
export const defaultDiscoveryOptions: DiscoveryOptions = {
  recursive: true,
  includeHidden: false,
  includeDirectories: false,
  filePatterns: ["*.tsp", "*.typespec"],
  excludePatterns: ["node_modules", ".git", ".vscode"],
  maxDepth: 10
};

/**
 * Base class for TypeSpec discovery implementations
 * Provides common functionality and error handling for all discovery operations
 */
export abstract class BaseTypeSpecDiscovery implements ITypeSpecDiscovery {
  protected rootPath: string;
  protected options: DiscoveryOptions;
  protected metrics: DiscoveryMetrics;

  constructor(rootPath: string, options?: DiscoveryOptions) {
    this.rootPath = rootPath;
    this.options = options || defaultDiscoveryOptions;
    this.metrics = {
      totalFilesFound: 0,
      totalDirectoriesScanned: 0,
      averageFileSize: 0,
      totalFileSize: 0,
      scanDuration: 0,
      filesPerSecond: 0,
      bytesPerSecond: 0
    };
  }

  /**
   * Validate root directory for discovery operations
   * @returns Promise resolving to validation result
   */
  protected validateRootDirectory(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔍 Validating root directory: ${this.rootPath}`);
      
      if (!this.rootPath) {
        throw new Error("Root directory path is required");
      }
      
      // Additional validation can be added here
      yield* Effect.log(`✅ Root directory validated: ${this.rootPath}`);
    });
  }

  /**
   * Validate file type for TypeSpec compatibility
   * @param fileName - File name to validate
   * @returns Promise resolving to validation result
   */
  protected validateFileType(fileName: string): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔍 Validating file type: ${fileName}`);
      
      if (!fileName || typeof fileName !== 'string') {
        return false;
      }
      
      const lowerFileName = fileName.toLowerCase();
      return lowerFileName.endsWith('.tsp') || lowerFileName.endsWith('.typespec');
    });
  }

  /**
   * Check if a directory should be excluded from scanning
   * @param dirPath - Directory path to check
   * @returns Promise resolving to exclusion result
   */
  protected shouldExcludeDirectory(dirPath: string): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      const dirName = dirPath.split('/').pop();
      
      for (const excludePattern of this.options.excludePatterns) {
        if (dirName === excludePattern) {
          yield* Effect.log(`🔍 Excluding directory: ${dirPath} (pattern: ${excludePattern})`);
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Update discovery metrics with file information
   * @param files - Files to include in metrics
   * @param scanTime - Time taken for scanning
   */
  protected updateMetrics(files: TypeSpecFileInfo[], scanTime: number): void {
    this.metrics.totalFilesFound = files.length;
    this.metrics.scanDuration = scanTime;
    
    if (files.length > 0) {
      this.metrics.totalFileSize = files.reduce((sum, file) => sum + file.fileSize, 0);
      this.metrics.averageFileSize = this.metrics.totalFileSize / files.length;
      this.metrics.filesPerSecond = files.length / (scanTime / 1000);
      this.metrics.bytesPerSecond = this.metrics.totalFileSize / (scanTime / 1000);
    }
  }

  /**
   * Get current discovery metrics
   * @returns Promise resolving to current metrics
   */
  getMetrics(): Effect.Effect<DiscoveryMetrics, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`📊 Discovery metrics: ${JSON.stringify(this.metrics, null, 2)}`);
      return { ...this.metrics };
    });
  }

  /**
   * Create discovery result with metadata
   * @param files - Discovered files
   * @param scannedDirectories - Directories scanned
   * @param scanTime - Time taken for scanning
   * @returns Discovery result
   */
  protected createDiscoveryResult(
    files: TypeSpecFileInfo[], 
    scannedDirectories: string[], 
    scanTime: number
  ): DiscoveryResult {
    this.updateMetrics(files, scanTime);
    
    return {
      files,
      totalCount: files.length,
      scannedDirectories,
      scanTime,
      options: this.options
    };
  }

  /**
   * Clean up discovery resources
   * @returns Promise resolving to cleanup result
   */
  cleanup(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Cleaning up discovery resources`);
      
      // Reset metrics
      this.metrics = {
        totalFilesFound: 0,
        totalDirectoriesScanned: 0,
        averageFileSize: 0,
        totalFileSize: 0,
        scanDuration: 0,
        filesPerSecond: 0,
        bytesPerSecond: 0
      };
      
      yield* Effect.log(`✅ Discovery resources cleaned up`);
    });
  }

  /**
   * Get default discovery options
   * @returns Default discovery options
   */
  protected getOptions(): DiscoveryOptions {
    return { ...defaultDiscoveryOptions, ...this.options };
  }
}

/**
 * Discovery utilities for common operations
 */
export class DiscoveryUtils {
  /**
   * Create file info object
   * @param filePath - File path
   * @returns File info object
   */
  static createFileInfo(filePath: string): TypeSpecFileInfo {
    const fileName = filePath.split('/').pop() || '';
    const parts = fileName.split('.');
    const fileExtension = parts.length > 1 ? parts[parts.length - 1] : '';
    
    return {
      filePath,
      fileName,
      fileSize: 0, // TODO: Get actual file size
      lastModified: new Date(), // TODO: Get actual modification time
      contentLength: 0, // TODO: Get actual content length
      fileType: fileExtension
    };
  }

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const threshold = 1024;
    let unitIndex = 0;
    
    while (bytes >= threshold && unitIndex < units.length - 1) {
      bytes /= threshold;
      unitIndex++;
    }
    
    return `${bytes.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format scan time for display
   * @param ms - Scan time in milliseconds
   * @returns Formatted scan time string
   */
  static formatScanTime(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      return `${(ms / 60000).toFixed(2)}m`;
    }
  }

  /**
   * Generate discovery summary
   * @param result - Discovery result
   * @returns Formatted summary string
   */
  static generateSummary(result: DiscoveryResult): string {
    const fileSize = DiscoveryUtils.formatFileSize(result.files.reduce((sum, file) => sum + file.fileSize, 0));
    const scanTime = DiscoveryUtils.formatScanTime(result.scanTime);
    const rate = DiscoveryUtils.formatFileSize(result.files.length > 0 ? result.files.length / (result.scanTime / 1000) : 0) + "/s";
    
    return `Found ${result.totalCount} TypeSpec files (${fileSize}) in ${scanTime} (${rate})`;
  }
}

/**
 * Discovery errors enum
 */
export enum DiscoveryError {
  INVALID_ROOT_DIRECTORY = "INVALID_ROOT_DIRECTORY",
  INVALID_FILE_PATH = "INVALID_FILE_PATH",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  SCAN_TIMEOUT = "SCAN_TIMEOUT",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  IO_ERROR = "IO_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED"
}

/**
 * Discovery error class
 */
export class DiscoveryError extends Error {
  constructor(
    public readonly type: DiscoveryError,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}

/**
 * Discovery warnings enum
 */
export enum DiscoveryWarning {
  NO_FILES_FOUND = "NO_FILES_FOUND",
  EMPTY_DIRECTORIES = "EMPTY_DIRECTORIES",
  EXCLUDED_PATTERNS = "EXCLUDED_PATTERNS",
  LARGE_FILE_SIZE = "LARGE_FILE_SIZE",
  DEEP_DIRECTORY_SCAN = "DEEP_DIRECTORY_SCAN"
}

/**
 * Discovery warning class
 */
export class DiscoveryWarning extends Error {
  constructor(
    public readonly type: DiscoveryWarning,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}

export { Effect, DiscoveryError, DiscoveryWarning };