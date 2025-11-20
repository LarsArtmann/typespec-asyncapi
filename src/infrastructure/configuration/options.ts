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
 * Merge options with defaults
 */
export function mergeWithDefaults(options?: Partial<EmitterOptions>): Required<EmitterOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  } as Required<EmitterOptions>;
}