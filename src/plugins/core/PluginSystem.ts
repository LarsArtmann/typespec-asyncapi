/**
 * Plugin System Foundation
 * 
 * Provides extensible plugin architecture for TypeSpec AsyncAPI emitter.
 * Supports dynamic plugin loading, configuration, and lifecycle management.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect"
import { Schema as Z } from "@effect/schema"
import { AsyncAPIObject } from "../../types/branded-types.js"
import { ValidationResult, RuntimeValidator, ValidatorFactory } from "../../validation/RuntimeValidator.js"

/**
 * Plugin metadata schema
 * Defines plugin information and capabilities
 */
export const PluginMetadataSchema = Z.object({
  name: Z.string().min(1, "Plugin name is required"),
  version: Z.string().min(1, "Plugin version is required"),
  description: Z.string().optional(),
  author: Z.string().optional(),
  license: Z.string().optional(),
  repository: Z.string().url().optional(),
  homepage: Z.string().url().optional(),
  keywords: Z.array(Z.string()).optional(),
  type: Z.enum(["protocol", "decorator", "validator", "processor", "transformer"]),
  capabilities: Z.array(Z.string()).optional(),
  dependencies: Z.array(Z.string()).optional(),
  compatibility: Z.array(Z.string()).optional()
}).strict()

/**
 * Plugin type definition
 * Union type for all plugin types supported by the system
 */
export type PluginType = "protocol" | "decorator" | "validator" | "processor" | "transformer"

/**
 * Plugin interface
 * Defines the contract that all plugins must implement
 */
export interface Plugin {
  readonly metadata: Z.infer<typeof PluginMetadataSchema>
  readonly config?: Record<string, unknown>
  readonly initialize: (config?: Record<string, unknown>) => Effect.Effect<void, Error>
  readonly execute: (input: PluginInput) => Effect.Effect<PluginOutput, Error>
  readonly shutdown: () => Effect.Effect<void, Error>
  readonly validate: (input: unknown) => Effect.Effect<ValidationResult, Error>
}

/**
 * Plugin input interface
 * Defines input data structure for plugin execution
 */
export interface PluginInput {
  readonly type: PluginType
  readonly data: unknown
  readonly config?: Record<string, unknown>
  readonly context?: Record<string, unknown>
}

/**
 * Plugin output interface
 * Defines output data structure from plugin execution
 */
export interface PluginOutput {
  readonly success: boolean
  readonly data?: unknown
  readonly errors?: Array<{code: string; message: string; severity: "error" | "warning"}>
  readonly warnings?: Array<{code: string; message: string; severity: "error" | "warning"}>
  readonly metadata?: Record<string, unknown>
}

/**
 * Plugin configuration interface
 * Defines plugin configuration options
 */
export interface PluginConfiguration {
  readonly enabled: boolean
  readonly config?: Record<string, unknown>
  readonly loadOrder?: number
  readonly autoLoad?: boolean
}

/**
 * Plugin registry interface
 * Manages plugin registration and lifecycle
 */
export interface PluginRegistry {
  readonly register: (plugin: Plugin) => Effect.Effect<void, Error>
  readonly unregister: (pluginName: string) => Effect.Effect<void, Error>
  readonly get: (pluginName: string) => Plugin | null
  readonly getAll: () => Array<Plugin>
  readonly getEnabled: () => Array<Plugin>
  readonly getConfig: (pluginName: string) => PluginConfiguration | null
  readonly setConfig: (pluginName: string, config: PluginConfiguration) => Effect.Effect<void, Error>
}

/**
 * Plugin manager interface
 * Coordinates plugin loading, execution, and lifecycle management
 */
export interface PluginManager {
  readonly registry: PluginRegistry
  readonly loadPlugin: (plugin: Plugin) => Effect.Effect<void, Error>
  readonly unloadPlugin: (pluginName: string) => Effect.Effect<void, Error>
  readonly executePlugin: (pluginName: string, input: PluginInput) => Effect.Effect<PluginOutput, Error>
  readonly executeAllPlugins: (type?: PluginType, input?: PluginInput) => Effect.Effect<Array<PluginOutput>, Error>
  readonly shutdown: () => Effect.Effect<void, Error>
  readonly getStatus: () => PluginManagerStatus
}

/**
 * Plugin manager status interface
 * Provides system health and status information
 */
export interface PluginManagerStatus {
  readonly totalPlugins: number
  readonly enabledPlugins: number
  readonly loadedPlugins: number
  readonly activePlugins: number
  readonly errorPlugins: number
  readonly lastActivity: Date | null
  readonly health: "healthy" | "degraded" | "critical"
}

/**
 * Plugin system configuration interface
 * Defines system-wide plugin configuration
 */
export interface PluginSystemConfiguration {
  readonly enabled: boolean
  readonly autoLoad: boolean
  readonly pluginDirectory: string
  readonly configDirectory: string
  readonly maxConcurrentPlugins: number
  readonly defaultLoadOrder: number
  readonly enableMetrics: boolean
  readonly enableLogging: boolean
  readonly securityValidation: boolean
}

/**
 * Base plugin class
 * Provides common functionality for all plugins
 */
export abstract class BasePlugin implements Plugin {
  protected metadata: Z.infer<typeof PluginMetadataSchema>
  protected config?: Record<string, unknown>
  protected isInitialized: boolean = false
  protected isShutdown: boolean = false

  constructor(metadata: Z.infer<typeof PluginMetadataSchema>, config?: Record<string, unknown>) {
    this.metadata = metadata
    this.config = config
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): Z.infer<typeof PluginMetadataSchema> {
    return this.metadata
  }

  /**
   * Get plugin configuration
   */
  getConfig(): Record<string, unknown> | undefined {
    return this.config
  }

  /**
   * Check if plugin is initialized
   */
  isInitializedPlugin(): boolean {
    return this.isInitialized
  }

  /**
   * Check if plugin is shutdown
   */
  isShutdownPlugin(): boolean {
    return this.isShutdown
  }

  /**
   * Initialize plugin with configuration
   */
  initialize(config?: Record<string, unknown>): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (this.isInitialized) {
        const error = new Error(`Plugin ${this.metadata.name} is already initialized`)
        yield* Effect.log(`❌ Plugin initialization failed: ${error.message}`)
        throw error
      }

      this.config = config || this.config

      // Perform plugin-specific initialization
      yield* Effect.log(`🔧 Initializing plugin: ${this.metadata.name}`)
      yield* this.initializePlugin()

      this.isInitialized = true
      yield* Effect.log(`✅ Plugin initialized successfully: ${this.metadata.name}`)
    })
  }

  /**
   * Shutdown plugin
   */
  shutdown(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (this.isShutdown) {
        const error = new Error(`Plugin ${this.metadata.name} is already shutdown`)
        yield* Effect.log(`❌ Plugin shutdown failed: ${error.message}`)
        throw error
      }

      if (!this.isInitialized) {
        const error = new Error(`Plugin ${this.metadata.name} is not initialized`)
        yield* Effect.log(`❌ Plugin shutdown failed: ${error.message}`)
        throw error
      }

      // Perform plugin-specific shutdown
      yield* Effect.log(`🔧 Shutting down plugin: ${this.metadata.name}`)
      yield* this.shutdownPlugin()

      this.isShutdown = true
      this.isInitialized = false
      yield* Effect.log(`✅ Plugin shutdown successfully: ${this.metadata.name}`)
    })
  }

  /**
   * Validate plugin input
   */
  validate(input: unknown): Effect.Effect<ValidationResult, Error> {
    return Effect.gen(function* () {
      // Basic validation
      if (!input || typeof input !== 'object') {
        const error = new Error(`Invalid input: expected object, got ${typeof input}`)
        yield* Effect.log(`❌ Plugin validation failed for ${this.metadata.name}: ${error.message}`)
        throw error
      }

      const pluginInput = input as PluginInput

      // Validate type
      if (!pluginInput.type || typeof pluginInput.type !== 'string') {
        const error = new Error(`Invalid plugin type: ${pluginInput.type}`)
        yield* Effect.log(`❌ Plugin validation failed for ${this.metadata.name}: ${error.message}`)
        throw error
      }

      // Type-specific validation
      yield* this.validateInput(pluginInput)

      yield* Effect.log(`✅ Plugin validation successful for ${this.metadata.name}`)
      
      return {
        isValid: true,
        errors: [],
        warnings: [],
        summary: {
          totalErrors: 0,
          totalWarnings: 0,
          totalInfo: 0,
          severity: "info"
        }
      }
    })
  }

  /**
   * Execute plugin with input
   */
  execute(input: PluginInput): Effect.Effect<PluginOutput, Error> {
    return Effect.gen(function* () {
      if (!this.isInitialized) {
        const error = new Error(`Plugin ${this.metadata.name} is not initialized`)
        yield* Effect.log(`❌ Plugin execution failed for ${this.metadata.name}: ${error.message}`)
        throw error
      }

      if (this.isShutdown) {
        const error = new Error(`Plugin ${this.metadata.name} is shutdown`)
        yield* Effect.log(`❌ Plugin execution failed for ${this.metadata.name}: ${error.message}`)
        throw error
      }

      yield* Effect.log(`🔧 Executing plugin: ${this.metadata.name}`)
      
      try {
        const result = yield* this.executePlugin(input)
        
        yield* Effect.log(`✅ Plugin execution successful: ${this.metadata.name}`)
        
        return {
          success: true,
          data: result,
          metadata: {
            pluginName: this.metadata.name,
            pluginType: this.metadata.type,
            executionTime: new Date()
          }
        }
      } catch (error) {
        yield* Effect.log(`❌ Plugin execution failed for ${this.metadata.name}: ${error}`)
        
        return {
          success: false,
          errors: [{
            code: "EXECUTION_ERROR",
            message: `Plugin execution failed: ${(error as Error).message}`,
            severity: "error"
          }],
          warnings: [],
          metadata: {
            pluginName: this.metadata.name,
            pluginType: this.metadata.type,
            executionTime: new Date(),
            error: error
          }
        }
      }
    })
  }

  /**
   * Plugin-specific initialization
   * Must be implemented by concrete plugin classes
   */
  protected abstract initializePlugin(): Effect.Effect<void, Error>

  /**
   * Plugin-specific shutdown
   * Must be implemented by concrete plugin classes
   */
  protected abstract shutdownPlugin(): Effect.Effect<void, Error>

  /**
   * Plugin-specific input validation
   * Must be implemented by concrete plugin classes
   */
  protected abstract validateInput(input: PluginInput): Effect.Effect<void, Error>

  /**
   * Plugin-specific execution
   * Must be implemented by concrete plugin classes
   */
  protected abstract executePlugin(input: PluginInput): Effect.Effect<unknown, Error>
}

/**
 * In-memory plugin registry implementation
 */
export class InMemoryPluginRegistry implements PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private configurations: Map<string, PluginConfiguration> = new Map()

  /**
   * Register a plugin
   */
  register(plugin: Plugin): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      const pluginName = plugin.getMetadata().name
      
      if (this.plugins.has(pluginName)) {
        const error = new Error(`Plugin ${pluginName} is already registered`)
        yield* Effect.log(`❌ Plugin registration failed: ${error.message}`)
        throw error
      }

      // Validate plugin metadata
      const validationResult = PluginMetadataSchema.safeParse(plugin.getMetadata())
      if (!validationResult.success) {
        const error = new Error(`Invalid plugin metadata: ${validationResult.error.message}`)
        yield* Effect.log(`❌ Plugin registration failed: ${error.message}`)
        throw error
      }

      this.plugins.set(pluginName, plugin)
      
      // Initialize plugin with default configuration
      const defaultConfig: PluginConfiguration = {
        enabled: true,
        autoLoad: true,
        loadOrder: 100
      }
      
      this.configurations.set(pluginName, defaultConfig)

      yield* Effect.log(`✅ Plugin registered successfully: ${pluginName}`)
    })
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (!this.plugins.has(pluginName)) {
        const error = new Error(`Plugin ${pluginName} is not registered`)
        yield* Effect.log(`❌ Plugin unregistration failed: ${error.message}`)
        throw error
      }

      const plugin = this.plugins.get(pluginName)!
      
      // Shutdown plugin if it's initialized
      if (plugin.isInitializedPlugin()) {
        yield* plugin.shutdown()
      }

      this.plugins.delete(pluginName)
      this.configurations.delete(pluginName)

      yield* Effect.log(`✅ Plugin unregistered successfully: ${pluginName}`)
    })
  }

  /**
   * Get plugin by name
   */
  get(pluginName: string): Plugin | null {
    return this.plugins.get(pluginName) || null
  }

  /**
   * Get all registered plugins
   */
  getAll(): Array<Plugin> {
    return Array.from(this.plugins.values())
  }

  /**
   * Get all enabled plugins
   */
  getEnabled(): Array<Plugin> {
    return Array.from(this.plugins.values()).filter(plugin => {
      const config = this.configurations.get(plugin.getMetadata().name)
      return config?.enabled ?? true
    })
  }

  /**
   * Get plugin configuration
   */
  getConfig(pluginName: string): PluginConfiguration | null {
    return this.configurations.get(pluginName) || null
  }

  /**
   * Set plugin configuration
   */
  setConfig(pluginName: string, config: PluginConfiguration): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (!this.plugins.has(pluginName)) {
        const error = new Error(`Plugin ${pluginName} is not registered`)
        yield* Effect.log(`❌ Plugin configuration failed: ${error.message}`)
        throw error
      }

      // Validate configuration
      if (config.enabled && !config.config) {
        config.config = {}
      }

      this.configurations.set(pluginName, config)

      yield* Effect.log(`✅ Plugin configuration updated: ${pluginName}`)
    })
  }

  /**
   * Get plugin status summary
   */
  getStatus(): PluginRegistryStatus {
    const plugins = this.getAll()
    const enabledPlugins = this.getEnabled()
    const disabledPlugins = plugins.filter(plugin => {
      const config = this.getConfig(plugin.getMetadata().name)
      return config ? !config.enabled : false
    })

    return {
      totalPlugins: plugins.length,
      enabledPlugins: enabledPlugins.length,
      disabledPlugins: disabledPlugins.length,
      loadedPlugins: plugins.filter(plugin => plugin.isInitializedPlugin()).length,
      errorPlugins: 0, // TODO: Track error state
      pluginTypes: {
        protocol: plugins.filter(p => p.getMetadata().type === "protocol").length,
        decorator: plugins.filter(p => p.getMetadata().type === "decorator").length,
        validator: plugins.filter(p => p.getMetadata().type === "validator").length,
        processor: plugins.filter(p => p.getMetadata().type === "processor").length,
        transformer: plugins.filter(p => p.getMetadata().type === "transformer").length
      }
    }
  }
}

/**
 * Plugin registry status interface
 */
export interface PluginRegistryStatus {
  readonly totalPlugins: number
  readonly enabledPlugins: number
  readonly disabledPlugins: number
  readonly loadedPlugins: number
  readonly errorPlugins: number
  readonly pluginTypes: {
    protocol: number
    decorator: number
    validator: number
    processor: number
    transformer: number
  }
}

/**
 * Plugin manager implementation
 */
export class InMemoryPluginManager implements PluginManager {
  private registry: PluginRegistry
  private configuration: PluginSystemConfiguration
  private plugins: Map<string, Plugin> = new Map()
  private metrics: PluginManagerMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastExecutionTime: null,
    executionTimes: [],
    errorCounts: {},
    warningCounts: {}
  }

  constructor(registry?: PluginRegistry, configuration?: PluginSystemConfiguration) {
    this.registry = registry || new InMemoryPluginRegistry()
    this.configuration = configuration || {
      enabled: true,
      autoLoad: true,
      pluginDirectory: "./plugins",
      configDirectory: "./config",
      maxConcurrentPlugins: 10,
      defaultLoadOrder: 100,
      enableMetrics: true,
      enableLogging: true,
      securityValidation: true
    }
  }

  /**
   * Get plugin registry
   */
  getRegistry(): PluginRegistry {
    return this.registry
  }

  /**
   * Get system configuration
   */
  getConfiguration(): PluginSystemConfiguration {
    return this.configuration
  }

  /**
   * Load a plugin
   */
  loadPlugin(plugin: Plugin): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Loading plugin: ${plugin.getMetadata().name}`)
      
      // Register plugin in registry
      yield* this.registry.register(plugin)
      this.plugins.set(plugin.getMetadata().name, plugin)

      // Initialize plugin with configuration
      const config = this.registry.getConfig(plugin.getMetadata().name)
      yield* plugin.initialize(config?.config)

      yield* Effect.log(`✅ Plugin loaded successfully: ${plugin.getMetadata().name}`)
    })
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginName: string): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Unloading plugin: ${pluginName}`)
      
      const plugin = this.plugins.get(pluginName)
      if (!plugin) {
        const error = new Error(`Plugin ${pluginName} is not loaded`)
        yield* Effect.log(`❌ Plugin unloading failed: ${error.message}`)
        throw error
      }

      // Shutdown plugin
      yield* plugin.shutdown()

      // Unregister from registry
      yield* this.registry.unregister(pluginName)
      this.plugins.delete(pluginName)

      yield* Effect.log(`✅ Plugin unloaded successfully: ${pluginName}`)
    })
  }

  /**
   * Execute a specific plugin
   */
  executePlugin(pluginName: string, input: PluginInput): Effect.Effect<PluginOutput, Error> {
    return Effect.gen(function* () {
      const startTime = Date.now()
      
      yield* Effect.log(`🔧 Executing plugin: ${pluginName}`)

      try {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) {
          const error = new Error(`Plugin ${pluginName} is not loaded`)
          yield* Effect.log(`❌ Plugin execution failed: ${error.message}`)
          throw error
        }

        // Validate input
        yield* plugin.validate(input)

        // Execute plugin
        const result = yield* plugin.execute(input)

        // Record metrics
        const executionTime = Date.now() - startTime
        this.recordMetrics(result, executionTime)

        yield* Effect.log(`✅ Plugin execution successful: ${pluginName} (${executionTime}ms)`)
        
        return result
      } catch (error) {
        // Record error metrics
        const executionTime = Date.now() - startTime
        this.recordMetrics({ success: false, errors: [{code: "EXECUTION_ERROR", message: (error as Error).message, severity: "error"}], warnings: [] }, executionTime)

        yield* Effect.log(`❌ Plugin execution failed: ${pluginName} (${executionTime}ms)`)
        
        throw error
      }
    })
  }

  /**
   * Execute all plugins of specific type
   */
  executeAllPlugins(type?: PluginType, input?: PluginInput): Effect.Effect<Array<PluginOutput>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing all plugins${type ? ` of type: ${type}` : ''}`)
      
      const plugins = type 
        ? this.getAll().filter(p => p.getMetadata().type === type)
        : this.getAll()

      const results: Array<PluginOutput> = []
      
      for (const plugin of plugins) {
        try {
          const pluginInput = input || { type: plugin.getMetadata().type, data: {} }
          const result = yield* this.executePlugin(plugin.getMetadata().name, pluginInput)
          results.push(result)
        } catch (error) {
          const executionTime = Date.now()
          
          results.push({
            success: false,
            errors: [{
              code: "EXECUTION_ERROR",
              message: (error as Error).message,
              severity: "error"
            }],
            warnings: [],
            metadata: {
              pluginName: plugin.getMetadata().name,
              pluginType: plugin.getMetadata().type,
              executionTime
            }
          })
        }
      }

      yield* Effect.log(`✅ Plugin execution completed: ${results.length} plugins`)
      
      return results
    })
  }

  /**
   * Shutdown all plugins
   */
  shutdown(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Shutting down all plugins`)
      
      const shutdownPromises = Array.from(this.plugins.values()).map(plugin => 
        plugin.shutdown().catch(error => {
          Effect.log(`⚠️ Plugin shutdown failed: ${plugin.getMetadata().name} - ${error}`)
        })
      )

      yield* Effect.all(shutdownPromises)

      // Clear registries
      this.plugins.clear()
      this.metrics.resetMetrics()

      yield* Effect.log(`✅ All plugins shutdown successfully`)
    })
  }

  /**
   * Get plugin manager status
   */
  getStatus(): PluginManagerStatus {
    const plugins = this.getAll()
    const enabledPlugins = this.registry.getEnabled()
    const loadedPlugins = plugins.filter(plugin => plugin.isInitializedPlugin())
    const errorPlugins = 0 // TODO: Track error state

    return {
      totalPlugins: plugins.length,
      enabledPlugins: enabledPlugins.length,
      loadedPlugins: loadedPlugins.length,
      activePlugins: loadedPlugins.filter(p => !p.isShutdownPlugin()).length,
      errorPlugins,
      lastActivity: this.metrics.lastExecutionTime,
      health: errorPlugins > 0 ? "critical" : loadedPlugins === enabledPlugins.length ? "healthy" : "degraded"
    }
  }

  /**
   * Record execution metrics
   */
  private recordMetrics(result: PluginOutput, executionTime: number): void {
    this.metrics.totalExecutions++
    
    if (result.success) {
      this.metrics.successfulExecutions++
    } else {
      this.metrics.failedExecutions++
      
      for (const error of result.errors || []) {
        const key = error.code || "unknown"
        this.metrics.errorCounts[key] = (this.metrics.errorCounts[key] || 0) + 1
      }
    }

    for (const warning of result.warnings || []) {
      const key = warning.code || "unknown"
      this.metrics.warningCounts[key] = (this.metrics.warningCounts[key] || 0) + 1
    }

    this.metrics.lastExecutionTime = new Date()
    this.metrics.executionTimes.push(executionTime)

    // Keep only last 100 execution times
    if (this.metrics.executionTimes.length > 100) {
      this.metrics.executionTimes.shift()
    }
  }

  /**
   * Get execution metrics
   */
  getMetrics(): PluginManagerMetrics {
    const averageExecutionTime = this.metrics.executionTimes.length > 0
      ? this.metrics.executionTimes.reduce((sum, time) => sum + time, 0) / this.metrics.executionTimes.length
      : 0

    return {
      ...this.metrics,
      averageExecutionTime,
      successRate: this.metrics.totalExecutions > 0 
        ? (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100 
        : 100,
      failureRate: this.metrics.totalExecutions > 0 
        ? (this.metrics.failedExecutions / this.metrics.totalExecutions) * 100 
        : 0
    }
  }
}

/**
 * Plugin manager metrics interface
 */
export interface PluginManagerMetrics {
  readonly totalExecutions: number
  readonly successfulExecutions: number
  readonly failedExecutions: number
  readonly lastExecutionTime: Date | null
  readonly executionTimes: number[]
  readonly errorCounts: Record<string, number>
  readonly warningCounts: Record<string, number>
  readonly averageExecutionTime: number
  readonly successRate: number
  readonly failureRate: number
}

/**
 * Plugin manager metrics with calculated values
 */
export interface PluginManagerMetricsWithCalculations extends PluginManagerMetrics {
  readonly successRate: number
  readonly failureRate: number
}

/**
 * Plugin factory for creating plugin instances
 */
export class PluginFactory {
  /**
   * Create protocol plugin
   */
  static createProtocolPlugin(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ): Plugin {
    return new ProtocolPlugin(name, version, description, implementation)
  }

  /**
   * Create decorator plugin
   */
  static createDecoratorPlugin(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ): Plugin {
    return new DecoratorPlugin(name, version, description, implementation)
  }

  /**
   * Create validator plugin
   */
  static createValidatorPlugin(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ): Plugin {
    return new ValidatorPlugin(name, version, description, implementation)
  }

  /**
   * Create processor plugin
   */
  static createProcessorPlugin(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ): Plugin {
    return new ProcessorPlugin(name, version, description, implementation)
  }

  /**
   * Create transformer plugin
   */
  static createTransformerPlugin(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ): Plugin {
    return new TransformerPlugin(name, version, description, implementation)
  }
}

/**
 * Protocol plugin implementation
 */
export class ProtocolPlugin extends BasePlugin {
  constructor(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ) {
    const metadata = {
      name,
      version,
      description,
      type: "protocol" as PluginType,
      capabilities: ["protocol"],
      dependencies: []
    }

    super(metadata, { implementation })
  }

  protected initializePlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Protocol-specific initialization logic
      yield* Effect.log(`🔧 Initializing protocol plugin: ${this.metadata.name}`)
    })
  }

  protected shutdownPlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Protocol-specific shutdown logic
      yield* Effect.log(`🔧 Shutting down protocol plugin: ${this.metadata.name}`)
    })
  }

  protected validateInput(input: PluginInput): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (input.type !== "protocol") {
        const error = new Error(`Invalid input type: expected 'protocol', got '${input.type}'`)
        yield* Effect.log(`❌ Protocol plugin validation failed: ${error.message}`)
        throw error
      }

      // Protocol-specific validation logic
      yield* Effect.log(`🔧 Validating protocol plugin input for ${this.metadata.name}`)
    })
  }

  protected executePlugin(input: PluginInput): Effect.Effect<unknown, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing protocol plugin: ${this.metadata.name}`)
      
      // Extract implementation from config
      const implementation = this.getConfig()?.implementation
      if (!implementation) {
        const error = new Error(`No implementation found for protocol plugin ${this.metadata.name}`)
        yield* Effect.log(`❌ Protocol plugin execution failed: ${error.message}`)
        throw error
      }

      // Execute protocol-specific implementation
      const result = yield* implementation(input)
      
      yield* Effect.log(`✅ Protocol plugin execution completed: ${this.metadata.name}`)
      
      return result
    })
  }
}

/**
 * Decorator plugin implementation
 */
export class DecoratorPlugin extends BasePlugin {
  constructor(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ) {
    const metadata = {
      name,
      version,
      description,
      type: "decorator" as PluginType,
      capabilities: ["decorator"],
      dependencies: []
    }

    super(metadata, { implementation })
  }

  protected initializePlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Decorator-specific initialization logic
      yield* Effect.log(`🔧 Initializing decorator plugin: ${this.metadata.name}`)
    })
  }

  protected shutdownPlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Decorator-specific shutdown logic
      yield* Effect.log(`🔧 Shutting down decorator plugin: ${this.metadata.name}`)
    })
  }

  protected validateInput(input: PluginInput): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (input.type !== "decorator") {
        const error = new Error(`Invalid input type: expected 'decorator', got '${input.type}'`)
        yield* Effect.log(`❌ Decorator plugin validation failed: ${error.message}`)
        throw error
      }

      // Decorator-specific validation logic
      yield* Effect.log(`🔧 Validating decorator plugin input for ${this.metadata.name}`)
    })
  }

  protected executePlugin(input: PluginInput): Effect.Effect<unknown, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing decorator plugin: ${this.metadata.name}`)
      
      // Extract implementation from config
      const implementation = this.getConfig()?.implementation
      if (!implementation) {
        const error = new Error(`No implementation found for decorator plugin ${this.metadata.name}`)
        yield* Effect.log(`❌ Decorator plugin execution failed: ${error.message}`)
        throw error
      }

      // Execute decorator-specific implementation
      const result = yield* implementation(input)
      
      yield* Effect.log(`✅ Decorator plugin execution completed: ${this.metadata.name}`)
      
      return result
    })
  }
}

/**
 * Validator plugin implementation
 */
export class ValidatorPlugin extends BasePlugin {
  constructor(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ) {
    const metadata = {
      name,
      version,
      description,
      type: "validator" as PluginType,
      capabilities: ["validation"],
      dependencies: []
    }

    super(metadata, { implementation })
  }

  protected initializePlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Validator-specific initialization logic
      yield* Effect.log(`🔧 Initializing validator plugin: ${this.metadata.name}`)
    })
  }

  protected shutdownPlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Validator-specific shutdown logic
      yield* Effect.log(`🔧 Shutting down validator plugin: ${this.metadata.name}`)
    })
  }

  protected validateInput(input: PluginInput): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (input.type !== "validator") {
        const error = new Error(`Invalid input type: expected 'validator', got '${input.type}'`)
        yield* Effect.log(`❌ Validator plugin validation failed: ${error.message}`)
        throw error
      }

      // Validator-specific validation logic
      yield* Effect.log(`🔧 Validating validator plugin input for ${this.metadata.name}`)
    })
  }

  protected executePlugin(input: PluginInput): Effect.Effect<unknown, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing validator plugin: ${this.metadata.name}`)
      
      // Extract implementation from config
      const implementation = this.getConfig()?.implementation
      if (!implementation) {
        const error = new Error(`No implementation found for validator plugin ${this.metadata.name}`)
        yield* Effect.log(`❌ Validator plugin execution failed: ${error.message}`)
        throw error
      }

      // Execute validator-specific implementation
      const result = yield* implementation(input)
      
      yield* Effect.log(`✅ Validator plugin execution completed: ${this.metadata.name}`)
      
      return result
    })
  }
}

/**
 * Processor plugin implementation
 */
export class ProcessorPlugin extends BasePlugin {
  constructor(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ) {
    const metadata = {
      name,
      version,
      description,
      type: "processor" as PluginType,
      capabilities: ["processing"],
      dependencies: []
    }

    super(metadata, { implementation })
  }

  protected initializePlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Processor-specific initialization logic
      yield* Effect.log(`🔧 Initializing processor plugin: ${this.metadata.name}`)
    })
  }

  protected shutdownPlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Processor-specific shutdown logic
      yield* Effect.log(`🔧 Shutting down processor plugin: ${this.metadata.name}`)
    })
  }

  protected validateInput(input: PluginInput): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (input.type !== "processor") {
        const error = new Error(`Invalid input type: expected 'processor', got '${input.type}'`)
        yield* Effect.log(`❌ Processor plugin validation failed: ${error.message}`)
        throw error
      }

      // Processor-specific validation logic
      yield* Effect.log(`🔧 Validating processor plugin input for ${this.metadata.name}`)
    })
  }

  protected executePlugin(input: PluginInput): Effect.Effect<unknown, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing processor plugin: ${this.metadata.name}`)
      
      // Extract implementation from config
      const implementation = this.getConfig()?.implementation
      if (!implementation) {
        const error = new Error(`No implementation found for processor plugin ${this.metadata.name}`)
        yield* Effect.log(`❌ Processor plugin execution failed: ${error.message}`)
        throw error
      }

      // Execute processor-specific implementation
      const result = yield* implementation(input)
      
      yield* Effect.log(`✅ Processor plugin execution completed: ${this.metadata.name}`)
      
      return result
    })
  }
}

/**
 * Transformer plugin implementation
 */
export class TransformerPlugin extends BasePlugin {
  constructor(
    name: string,
    version: string,
    description: string,
    implementation: (input: PluginInput) => Effect.Effect<unknown, Error>
  ) {
    const metadata = {
      name,
      version,
      description,
      type: "transformer" as PluginType,
      capabilities: ["transformation"],
      dependencies: []
    }

    super(metadata, { implementation })
  }

  protected initializePlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Transformer-specific initialization logic
      yield* Effect.log(`🔧 Initializing transformer plugin: ${this.metadata.name}`)
    })
  }

  protected shutdownPlugin(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Transformer-specific shutdown logic
      yield* Effect.log(`🔧 Shutting down transformer plugin: ${this.metadata.name}`)
    })
  }

  protected validateInput(input: PluginInput): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (input.type !== "transformer") {
        const error = new Error(`Invalid input type: expected 'transformer', got '${input.type}'`)
        yield* Effect.log(`❌ Transformer plugin validation failed: ${error.message}`)
        throw error
      }

      // Transformer-specific validation logic
      yield* Effect.log(`🔧 Validating transformer plugin input for ${this.metadata.name}`)
    })
  }

  protected executePlugin(input: PluginInput): Effect.Effect<unknown, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Executing transformer plugin: ${this.metadata.name}`)
      
      // Extract implementation from config
      const implementation = this.getConfig()?.implementation
      if (!implementation) {
        const error = new Error(`No implementation found for transformer plugin ${this.metadata.name}`)
        yield* Effect.log(`❌ Transformer plugin execution failed: ${error.message}`)
        throw error
      }

      // Execute transformer-specific implementation
      const result = yield* implementation(input)
      
      yield* Effect.log(`✅ Transformer plugin execution completed: ${this.metadata.name}`)
      
      return result
    })
  }
}