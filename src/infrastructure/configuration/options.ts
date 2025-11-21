/**
 * Configuration Options for AsyncAPI Emitter
 */

export type EmitterOptions = {
  outputFile?: string;
  version?: string;
  title?: string;
  description?: string;
  server?: ServerOptions;
}

export type ServerOptions = {
  url?: string;
  protocol?: string;
  description?: string;
}

export const DEFAULT_OPTIONS: Partial<EmitterOptions> = {
  outputFile: "asyncapi.yaml",
  version: "1.0.0",
  title: "Generated API",
  description: "API generated from TypeSpec",
};

export const DEFAULT_SERVER_OPTIONS: Partial<ServerOptions> = {
  protocol: "http",
  description: "Default server",
};

/**
 * 🚨 LEGACY COMPATIBILITY: Schema export expected by tests
 * 
 * Tests expect ASYNC_API_EMITTER_OPTIONS_SCHEMA but this creates
 * SPLIT BRAIN between multiple configuration definitions:
 * - This file has EmitterOptions
 * - asyncAPIEmitterOptions.ts has AsyncAPIEmitterOptions  
 * - Tests expect schema that doesn't match either
 * 
 * TODO: CONSOLIDATE configuration into single source of truth
 * TODO: REFACTOR tests to use unified configuration
 * TODO: ELIMINATE duplicate configuration types
 * TODO: IMPLEMENT proper schema validation
 */
export const ASYNC_API_EMITTER_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    "output-file": {
      type: "string",
      description: "Output file name without extension",
      default: "asyncapi",
    },
    version: {
      type: "string",
      description: "AsyncAPI specification version",
      default: "3.0.0",
    },
    title: {
      type: "string",
      description: "Generated document title",
    },
    description: {
      type: "string",
      description: "Generated document description",
    },
    "file-type": {
      type: "string",
      enum: ["json", "yaml"],
      description: "Output file format",
      default: "yaml",
    },
  },
  required: ["version"],
} as const;

/**
 * Create AsyncAPI Emitter Options
 * 
 * Factory function for creating properly typed emitter options
 */
export function createAsyncAPIEmitterOptions(options?: Partial<EmitterOptions>): EmitterOptions {
  return mergeWithDefaults(options);
}

/**
 * Merge options with defaults
 */
export function mergeWithDefaults(options?: Partial<EmitterOptions>): Required<EmitterOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  } as Required<EmitterOptions>;
}