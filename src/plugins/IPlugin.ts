/**
 * M031: Unified Plugin Base Interface
 * 
 * This is the foundation of the standardized plugin system that replaces
 * the current plugin chaos with a unified, extensible architecture.
 * 
 * Key Design Principles:
 * - Lifecycle Management: initialize → configure → process → dispose
 * - Error Isolation: Plugin failures don't crash the system
 * - Third-Party Ready: External developers can create plugins
 * - Hot Reload: Add/remove plugins without restart
 * - Protocol Agnostic: Works with any AsyncAPI protocol
 */

import { Effect } from "effect"
import type { DecoratorContext, Model, Operation } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Plugin initialization context providing access to system resources
 */
export interface IPluginContext {
  /** Plugin configuration from user */
  readonly config: Record<string, unknown>
  
  /** System logger for plugin diagnostics */
  readonly logger: {
    debug(message: string, ...args: unknown[]): void
    info(message: string, ...args: unknown[]): void
    warn(message: string, ...args: unknown[]): void
    error(message: string, ...args: unknown[]): void
  }
  
  /** Plugin registry for accessing other plugins */
  readonly registry: IPluginRegistry
  
  /** Plugin's working directory for temporary files */
  readonly workingDirectory: string
}

/**
 * Plugin processing result containing generated bindings and metadata
 */
export interface IPluginResult {
  /** Generated protocol bindings */
  readonly bindings: Record<string, unknown>
  
  /** Additional metadata for validation/documentation */
  readonly metadata?: Record<string, unknown>
  
  /** Dependencies on other plugins (for ordering) */
  readonly dependencies?: string[]
  
  /** Whether this result should be cached */
  readonly cacheable?: boolean
}

/**
 * Plugin capabilities defining what the plugin can do
 */
export interface IPluginCapabilities {
  /** Supported AsyncAPI protocols */
  readonly supportedProtocols: string[]
  
  /** Supported binding types */
  readonly bindingTypes: ('server' | 'channel' | 'operation' | 'message')[]
  
  /** Whether plugin supports hot reload */
  readonly supportsHotReload: boolean
  
  /** Whether plugin can run in isolation */
  readonly isolationSupport: boolean
  
  /** Plugin performance characteristics */
  readonly performance: {
    /** Estimated processing time in ms */
    readonly averageProcessingTime: number
    /** Memory usage in MB */
    readonly memoryUsage: number
    /** Whether plugin does heavy computation */
    readonly computeIntensive: boolean
  }
}

/**
 * UNIFIED PLUGIN INTERFACE - The Foundation of Plugin Ecosystem
 * 
 * All plugins (built-in and third-party) implement this interface.
 * Provides standardized lifecycle, error handling, and capabilities.
 */
export interface IPlugin {
  /** Plugin unique identifier (used for registration) */
  readonly name: string
  
  /** Plugin semantic version */
  readonly version: string
  
  /** Plugin description for documentation */
  readonly description: string
  
  /** Plugin author/organization */
  readonly author?: string
  
  /** Plugin capabilities and supported features */
  readonly capabilities: IPluginCapabilities

  /**
   * LIFECYCLE: Initialize plugin with system context
   * Called once when plugin is loaded into registry
   * 
   * @param context Plugin initialization context
   * @returns Effect succeeding on successful initialization
   */
  initialize(context: IPluginContext): Effect.Effect<void, Error>

  /**
   * LIFECYCLE: Configure plugin for specific usage
   * Called before each processing session
   * 
   * @param config User-provided configuration
   * @returns Effect succeeding with validated configuration
   */
  configure(config: Record<string, unknown>): Effect.Effect<Record<string, unknown>, Error>

  /**
   * CORE: Process TypeSpec target and generate protocol bindings
   * This is where the plugin does its main work
   * 
   * @param context TypeSpec decorator context
   * @param target Operation or Model being processed
   * @param asyncApiDoc Current AsyncAPI document state
   * @returns Effect producing plugin results
   */
  processBinding(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<IPluginResult, Error>

  /**
   * VALIDATION: Validate plugin-specific configuration
   * Used for early error detection and user feedback
   * 
   * @param config Configuration to validate
   * @returns Effect succeeding if configuration is valid
   */
  validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error>

  /**
   * LIFECYCLE: Dispose plugin and clean up resources
   * Called when plugin is unloaded or system shuts down
   * 
   * @returns Effect succeeding on successful cleanup
   */
  dispose(): Effect.Effect<void, Error>

  /**
   * INTROSPECTION: Get plugin health and status information
   * Used for monitoring and debugging
   * 
   * @returns Plugin health status
   */
  getHealthStatus(): Effect.Effect<{
    readonly healthy: boolean
    readonly errors: string[]
    readonly warnings: string[]
    readonly lastProcessedAt?: Date
    readonly processedCount: number
  }, Error>

  /**
   * OPTIONAL: Hot reload support - recreate plugin instance
   * Only implemented by plugins that support hot reloading
   * 
   * @param newConfig Updated configuration
   * @returns Effect producing new plugin instance
   */
  reload?(newConfig: Record<string, unknown>): Effect.Effect<IPlugin, Error>

  /**
   * OPTIONAL: Plugin-specific documentation generation
   * Generate examples, schemas, or other documentation
   * 
   * @param target Target being processed
   * @returns Generated documentation
   */
  generateDocumentation?(target: Operation | Model): Effect.Effect<Record<string, unknown>, Error>
}

/**
 * Plugin registry interface for managing plugin lifecycle
 */
export interface IPluginRegistry {
  /** Register a plugin instance */
  register(plugin: IPlugin): Effect.Effect<void, Error>
  
  /** Unregister a plugin by name */
  unregister(name: string): Effect.Effect<void, Error>
  
  /** Get plugin by name */
  getPlugin(name: string): Effect.Effect<IPlugin, Error>
  
  /** Get all registered plugins */
  getAllPlugins(): Effect.Effect<IPlugin[], Error>
  
  /** Discover plugins in directory */
  discover(directory: string): Effect.Effect<IPlugin[], Error>
  
  /** Check if plugin is registered */
  hasPlugin(name: string): Effect.Effect<boolean, Error>
  
  /** Get plugins supporting specific protocol */
  getPluginsForProtocol(protocol: string): Effect.Effect<IPlugin[], Error>
}

/**
 * Plugin loading error types for better error handling
 */
export class PluginLoadingError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly reason: string,
    public readonly cause?: Error
  ) {
    super(`Failed to load plugin '${pluginName}': ${reason}`)
    this.name = 'PluginLoadingError'
  }
}

export class PluginConfigurationError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly configPath: string,
    public readonly reason: string
  ) {
    super(`Configuration error in plugin '${pluginName}' at '${configPath}': ${reason}`)
    this.name = 'PluginConfigurationError'
  }
}

export class PluginExecutionError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly operation: string,
    public readonly reason: string,
    public readonly cause?: Error
  ) {
    super(`Plugin '${pluginName}' failed during '${operation}': ${reason}`)
    this.name = 'PluginExecutionError'
  }
}
