/**
 * 🏗️ UNIFIED ASYNCAPI CONFIGURATION SYSTEM
 * 
 * Eliminates split-brain between multiple config files
 * Uses discriminated unions for compile-time safety
 * Replaces booleans with proper enums
 */

import type { Protocol } from "../types/domain/asyncapi-domain-types.js";
import type { SerializationFormat } from "../core/serialization-format-option.js";

/**
 * Output File Configuration
 * Uses discriminated union for type safety
 */
export type OutputFileConfig = {
  readonly format: SerializationFormat; // Enum instead of string
  readonly path: string;
  readonly compression: "none" | "gzip" | "brotli";
} & (
  | { readonly format: "json" }
  | { readonly format: "yaml"; readonly prettyPrint: boolean }
);

/**
 * Protocol Configuration
 * Centralized protocol settings
 */
export type ProtocolConfig = {
  readonly defaultProtocol: Protocol;
  readonly bindings: Record<string, unknown>;
  readonly security: SecurityConfig | null;
};

/**
 * Security Configuration
 * Proper typing for security schemes
 */
export type SecurityConfig = {
  readonly type: "oauth2" | "apiKey" | "http" | "jwe" | "jws";
  readonly description: string;
} & (
  | { readonly type: "oauth2"; readonly flows: Record<string, unknown> }
  | { readonly type: "apiKey"; readonly name: string; readonly in: "header" | "query" | "cookie" }
  | { readonly type: "http"; readonly scheme: "basic" | "bearer" | "digest" }
);

/**
 * Mode Configuration
 * Eliminates boolean confusion with discriminated union
 */
export type ModeConfig = 
  | { readonly mode: "production"; readonly benchmarking: false }
  | { readonly mode: "development"; readonly benchmarking: boolean; readonly enableDebug: boolean };

/**
 * Unified AsyncAPI Configuration
 * Single source of truth with type safety
 */
export type UnifiedAsyncAPIConfig = {
  readonly output: OutputFileConfig;
  readonly protocol: ProtocolConfig | null;
  readonly validation: ValidationConfig;
  readonly mode: ModeConfig;
} & {
  readonly metadata: {
    readonly title: string;
    readonly version: string;
    readonly description?: string;
  };
};

/**
 * Validation Configuration
 * Performance-critical validation settings
 */
export type ValidationConfig = {
  readonly strict: boolean;
  readonly enableCache: boolean;
  readonly maxDocumentSize: number; // uint for performance
  readonly timeoutMs: number; // uint for precision
};

/**
 * Legacy compatibility types
 * TODO: Gradually remove as system migrates to unified config
 */
export type AsyncAPIEmitterOptions = Omit<UnifiedAsyncAPIConfig, "protocol" | "validation" | "mode">;

/**
 * Configuration factory with validation
 */
export function createAsyncAPIConfig(input: Partial<UnifiedAsyncAPIConfig>): UnifiedAsyncAPIConfig {
  return {
    output: {
      format: "yaml",
      path: "asyncapi",
      compression: "none",
      ...input.output
    },
    protocol: input.protocol ?? null,
    validation: {
      strict: false,
      enableCache: true,
      maxDocumentSize: 10_000_000, // 10MB limit
      timeoutMs: 30_000, // 30 seconds
      ...input.validation
    },
    mode: input.mode ?? { mode: "development", benchmarking: true, enableDebug: false },
    metadata: {
      title: input.metadata?.title ?? "Generated API",
      version: input.metadata?.version ?? "1.0.0",
      description: input.metadata?.description,
      ...input.metadata
    }
  };
}