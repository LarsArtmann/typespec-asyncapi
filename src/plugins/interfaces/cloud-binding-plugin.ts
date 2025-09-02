import { Effect } from "effect"
import type { DecoratorContext, Operation, Model } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Base configuration for cloud provider bindings
 */
export type CloudBindingConfig = {
  /** Cloud provider identifier */
  provider?: string
  
  /** Service region or zone */
  region?: string
  
  /** Environment (dev, staging, prod) */
  environment?: string
  
  /** Additional tags for resource organization */
  tags?: string[]
  
  /** Authentication configuration */
  auth?: {
    type: 'iam-role' | 'access-keys' | 'oauth' | 'service-account'
    [key: string]: unknown
  }
}

/**
 * Result of cloud binding processing
 */
export type CloudBindingResult = {
  /** AsyncAPI channel bindings */
  bindings: Record<string, Record<string, unknown>>
  
  /** Generated or modified channels */
  channels: Record<string, {
    address?: string
    description?: string
    bindings?: Record<string, unknown>
    messages?: Record<string, unknown>
  }>
  
  /** Generated or modified operations */
  operations: Record<string, {
    action: 'send' | 'receive'
    channel: { $ref: string }
    bindings?: Record<string, unknown>
    messages?: Array<{ $ref: string }>
  }>
  
  /** Additional components (schemas, security, etc.) */
  components: Record<string, unknown>
}

/**
 * Cloud binding plugin interface
 * 
 * Defines the contract for cloud provider-specific binding plugins
 * that extend AsyncAPI specifications with cloud-native features.
 */
export type CloudBindingPlugin = {
  /** Unique identifier for the binding type */
  readonly bindingType: string
  
  /** Human-readable plugin name */
  readonly name: string
  
  /** Plugin version */
  readonly version: string
  
  /** Plugin description */
  readonly description: string
  
  /**
   * Process cloud bindings for a given target
   * 
   * @param context - TypeSpec decorator context
   * @param target - Operation or Model being processed
   * @param asyncApiDoc - Current AsyncAPI document state
   * @returns Effect that produces binding results or fails with validation errors
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error>
  
  /**
   * Validate plugin configuration
   * 
   * @param config - Plugin-specific configuration
   * @returns Effect that succeeds with validation status or fails with error
   */
  validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error>
  
  /**
   * Get plugin capabilities and supported features
   * 
   * @returns Object describing plugin capabilities
   */
  getCapabilities(): Record<string, unknown>
  
  /**
   * Optional: Generate additional documentation or examples
   * 
   * @param target - Target being processed
   * @returns Generated documentation or examples
   */
  generateDocumentation?(target: Operation | Model): Record<string, unknown>
  
  /**
   * Optional: Validate target compatibility
   * 
   * @param target - Target to validate
   * @returns Whether the target is compatible with this plugin
   */
  isCompatible?(target: Operation | Model): boolean
  
  /**
   * Optional: Transform AsyncAPI document post-processing
   * 
   * @param asyncApiDoc - Complete AsyncAPI document
   * @returns Transformed document
   */
  transformDocument?(asyncApiDoc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error>
}

/**
 * Cloud binding plugin registry
 */
export class CloudBindingPluginRegistry {
  private readonly plugins = new Map<string, CloudBindingPlugin>()
  
  /**
   * Register a cloud binding plugin
   */
  register(plugin: CloudBindingPlugin): void {
    this.plugins.set(plugin.bindingType, plugin)
    Effect.log(`📦 Registered cloud binding plugin: ${plugin.name} (${plugin.bindingType})`)
  }
  
  /**
   * Get plugin by binding type
   */
  getPlugin(bindingType: string): CloudBindingPlugin | undefined {
    return this.plugins.get(bindingType)
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): CloudBindingPlugin[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Check if binding type is supported
   */
  isSupported(bindingType: string): boolean {
    return this.plugins.has(bindingType)
  }
  
  /**
   * Process bindings using appropriate plugins
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    bindingType: string,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    const self = this
    return Effect.gen(function* () {
      const plugin = self.plugins.get(bindingType)
      
      if (!plugin) {
        return yield* Effect.fail(new Error(`Unsupported binding type: ${bindingType}`))
      }
      
      if (plugin.isCompatible && !plugin.isCompatible(target)) {
        return yield* Effect.fail(new Error(`Target ${target.name} is not compatible with ${bindingType} bindings`))
      }
      
      return yield* plugin.processBindings(context, target, asyncApiDoc)
    })
  }
  
  /**
   * Get capabilities for all registered plugins
   */
  getAllCapabilities(): Record<string, Record<string, unknown>> {
    const capabilities: Record<string, Record<string, unknown>> = {}
    
    for (const [bindingType, plugin] of this.plugins) {
      capabilities[bindingType] = {
        ...plugin.getCapabilities(),
        name: plugin.name,
        version: plugin.version,
        description: plugin.description
      }
    }
    
    return capabilities
  }
  
  /**
   * Validate all plugin configurations
   */
  validateAllConfigurations(
    configs: Record<string, Record<string, unknown>>
  ): Effect.Effect<boolean, Error> {
    const self = this
    return Effect.gen(function* () {
      for (const [bindingType, config] of Object.entries(configs)) {
        const plugin = self.plugins.get(bindingType)
        if (plugin) {
          yield* plugin.validateConfiguration(config)
        }
      }
      return true
    })
  }
}

/**
 * Global cloud binding plugin registry instance
 */
export const globalCloudBindingRegistry = new CloudBindingPluginRegistry()

/**
 * Plugin registration helper
 */
export function registerCloudBindingPlugin(plugin: CloudBindingPlugin): void {
  globalCloudBindingRegistry.register(plugin)
}

/**
 * Base class for cloud binding plugins with common functionality
 */
export abstract class BaseCloudBindingPlugin implements CloudBindingPlugin {
  abstract readonly bindingType: string
  abstract readonly name: string
  abstract readonly version: string
  abstract readonly description: string
  
  abstract processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error>
  
  abstract validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error>
  
  abstract getCapabilities(): Record<string, unknown>
  
  /**
   * Default compatibility check - all targets are compatible
   */
  isCompatible(_target: Operation | Model): boolean {
    return true
  }
  
  /**
   * Default documentation generator
   */
  generateDocumentation(target: Operation | Model): Record<string, unknown> {
    return {
      bindingType: this.bindingType,
      targetName: target.name,
      targetKind: target.kind,
      plugin: {
        name: this.name,
        version: this.version,
        description: this.description
      }
    }
  }
  
  /**
   * Default document transformer - no transformation
   */
  transformDocument(asyncApiDoc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.succeed(asyncApiDoc)
  }
  
  /**
   * Helper method to create empty result
   */
  protected createEmptyResult(): CloudBindingResult {
    return {
      bindings: {},
      channels: {},
      operations: {},
      components: {}
    }
  }
  
  /**
   * Helper method to merge results
   */
  protected mergeResults(
    result1: CloudBindingResult,
    result2: CloudBindingResult
  ): CloudBindingResult {
    return {
      bindings: { ...result1.bindings, ...result2.bindings },
      channels: { ...result1.channels, ...result2.channels },
      operations: { ...result1.operations, ...result2.operations },
      components: { ...result1.components, ...result2.components }
    }
  }
}

/**
 * Validation error for cloud binding configurations
 */
export class CloudBindingValidationError extends Error {
  constructor(
    message: string,
    public readonly bindingType: string,
    public readonly field?: string
  ) {
    super(`${bindingType} binding validation error: ${message}`)
    this.name = 'CloudBindingValidationError'
  }
}