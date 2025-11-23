/**
 * Simple Configuration
 * 
 * MINIMAL WORKING VERSION: Basic configuration without complex schemas
 * Focus on getting compilation working first
 */

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGURATION = {
  asyncapi: "3.0.0",
  library: "1.0.0",
  
  output: {
    directory: "/Users/larsartmann/projects/typespec-asyncapi",
    file: "asyncapi",
    format: "yaml" as const,
    encoding: "utf8" as const,
  },
  
  content: {
    title: "AsyncAPI Specification",
    version: "1.0.0",
    description: "Generated AsyncAPI specification from TypeSpec",
    contentType: "application/json" as const,
  },
  
  server: {
    url: "http://localhost:3000",
    protocol: "http" as const,
    description: "Default development server",
  },
  
  validation: {
    strict: true,
    warnings: true,
    emitErrors: true,
  },
  
  logging: {
    level: "info" as const,
    file: "/Users/larsartmann/projects/typespec-asyncapi/typespec-asyncapi.log",
    console: true,
  },
  
  advanced: {
    caching: true,
    optimization: true,
    experimental: false,
  },
} as const;

/**
 * Type definitions
 */
export type Configuration = typeof DEFAULT_CONFIGURATION;
export type ConfigurationInput = Partial<Configuration>;

/**
 * Configuration utilities
 */
export const configurationUtils = {
  /**
   * Create configuration from user input
   */
  create: (userConfig?: ConfigurationInput): Configuration => {
    return {
      ...DEFAULT_CONFIGURATION,
      ...userConfig,
      // Deep merge nested objects
      output: { ...DEFAULT_CONFIGURATION.output, ...userConfig?.output },
      content: { ...DEFAULT_CONFIGURATION.content, ...userConfig?.content },
      server: { ...DEFAULT_CONFIGURATION.server, ...userConfig?.server },
      validation: { ...DEFAULT_CONFIGURATION.validation, ...userConfig?.validation },
      logging: { ...DEFAULT_CONFIGURATION.logging, ...userConfig?.logging },
      advanced: { ...DEFAULT_CONFIGURATION.advanced, ...userConfig?.advanced },
    };
  },
} as const;

/**
 * Configuration exports
 */
export const configUtils = {
  default: DEFAULT_CONFIGURATION,
  utils: configurationUtils,
} as const;