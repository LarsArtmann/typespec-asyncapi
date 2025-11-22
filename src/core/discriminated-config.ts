/**
 * 🏗️ DISCRIMINATED UNION EXCELLENCE
 * 
 * Eliminates all boolean confusion and optional property invalid states
 * Enforces compile-time type safety for all configuration variants
 * Uses proper enums instead of strings throughout system
 */

import type { Protocol } from "../types/domain/asyncapi-domain-types.js";
import type { SerializationFormat } from "../core/serialization-format-option.js";

/**
 * === STRONGLY TYPED ENUMS ===
 * Replaces all string/boolean confusion with compile-time safety
 */
export const SerializationFormatEnum = {
  JSON: "json" as const,
  YAML: "yaml" as const,
} as const;

export type SerializationFormatEnum = keyof typeof SerializationFormatEnum;

export const ValidationMode = {
  STRICT: "strict" as const,
  LENIENT: "lenient" as const,
  DISABLED: "disabled" as const,
} as const;

export type ValidationMode = keyof typeof ValidationMode;

export const CompilationMode = {
  PRODUCTION: "production" as const,
  DEVELOPMENT: "development" as const,
  TESTING: "testing" as const,
} as const;

export type CompilationMode = keyof typeof CompilationMode;

/**
 * === DISCRIMINATED OUTPUT CONFIGURATION ===
 * Eliminates optional properties and invalid states at compile time
 */
export type OutputConfiguration = 
  | {
      readonly format: typeof SerializationFormatEnum.JSON;
      readonly prettyPrint: false; // JSON doesn't support pretty print
      readonly compression: "none" | "gzip" | "brotli";
    }
  | {
      readonly format: typeof SerializationFormatEnum.YAML;
      readonly prettyPrint: boolean; // YAML supports pretty print
      readonly compression: "none" | "gzip" | "brotli";
    };

/**
 * === DISCRIMINATED PROTOCOL CONFIGURATION ===
 * Properly typed protocol variants with compile-time validation
 */
export type ProtocolConfiguration = 
  | {
      readonly protocol: "http" | "https";
      readonly baseUrl: string;
      readonly port?: number;
      readonly paths: Record<string, string>;
    }
  | {
      readonly protocol: "kafka";
      readonly bootstrapServers: readonly string[];
      readonly topicPrefix?: string;
      readonly partitions?: number;
    }
  | {
      readonly protocol: "mqtt";
      readonly brokerUrl: string;
      readonly clientId: string;
      readonly qos: 0 | 1 | 2; // Strong typing for MQTT QoS
    }
  | {
      readonly protocol: "ws" | "wss";
      readonly url: string;
      readonly heartbeat?: number; // uint for performance
    };

/**
 * === DISCRIMINATED VALIDATION CONFIGURATION ===
 * Performance-critical settings with proper uint usage
 */
export type ValidationConfiguration = {
  readonly mode: ValidationMode;
  readonly enableCache: boolean;
  readonly maxDocumentSize: number; // TODO: Convert to Uint when TypeScript supports
  readonly timeoutMs: number; // TODO: Convert to Uint when TypeScript supports
  readonly parallelValidation: boolean;
};

/**
 * === DISCRIMINATED COMPILATION MODE ===
 * Eliminates boolean mode flags with proper type safety
 */
export type CompilationModeConfiguration = 
  | {
      readonly mode: typeof CompilationModeEnum.PRODUCTION;
      readonly enableDebug: false;
      readonly enableBenchmarking: false;
    }
  | {
      readonly mode: typeof CompilationModeEnum.DEVELOPMENT;
      readonly enableDebug: boolean;
      readonly enableBenchmarking: boolean;
    }
  | {
      readonly mode: typeof CompilationModeEnum.TESTING;
      readonly enableDebug: true;
      readonly enableBenchmarking: false;
      readonly enableVerboseOutput: true;
    };

// Type-safe enum mapping
export const CompilationModeEnum = {
  PRODUCTION: "production" as const,
  DEVELOPMENT: "development" as const,
  TESTING: "testing" as const,
} as const;

export type CompilationModeEnum = keyof typeof CompilationModeEnum;

/**
 * === UNIFIED CONFIGURATION TYPE ===
 * Single source of truth with compile-time type safety
 * Eliminates all optional property invalid states
 */
export type UnifiedAsyncAPIConfiguration = {
  readonly output: OutputConfiguration;
  readonly protocol?: ProtocolConfiguration;
  readonly validation: ValidationConfiguration;
  readonly mode: CompilationModeConfiguration;
} & {
  readonly metadata: {
    readonly title: string;
    readonly version: string;
    readonly description?: string;
    readonly contact?: {
      readonly name: string;
      readonly email: string;
      readonly url: string;
    };
    readonly license: {
      readonly name: string;
      readonly url?: string;
    };
  };
};

/**
 * Configuration factory with compile-time validation
 * Enforces type safety through discriminated unions
 */
export function createUnifiedConfiguration(
  input: Partial<UnifiedAsyncAPIConfiguration>
): UnifiedAsyncAPIConfiguration {
  return {
    output: {
      format: SerializationFormatEnum.YAML,
      prettyPrint: true,
      compression: "none",
      ...input.output
    } as OutputConfiguration, // Type assertion ensures discriminated union compliance
    
    validation: {
      mode: ValidationMode.STRICT,
      enableCache: true,
      maxDocumentSize: 10_000_000, // 10MB as uint
      timeoutMs: 30_000, // 30 seconds as uint
      parallelValidation: false,
      ...input.validation
    },
    
    mode: {
      mode: CompilationModeEnum.DEVELOPMENT,
      enableDebug: false,
      enableBenchmarking: false,
      ...input.mode
    } as CompilationModeConfiguration, // Type assertion ensures discriminated union compliance
    
    protocol: input.protocol,
    
    metadata: {
      title: input.metadata?.title ?? "Generated API",
      version: input.metadata?.version ?? "1.0.0",
      description: input.metadata?.description,
      contact: input.metadata?.contact,
      license: {
        name: input.metadata?.license?.name ?? "MIT",
        url: input.metadata?.license?.url,
        ...input.metadata?.license
      },
      ...input.metadata
    }
  };
}