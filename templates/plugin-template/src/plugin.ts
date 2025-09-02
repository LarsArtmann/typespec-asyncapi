import { Effect } from "effect"
import type { DecoratorContext, Operation, Model } from "@typespec/compiler"
import type { AsyncAPIObject } from "@typespec/asyncapi/types"
import {
  BaseCloudBindingPlugin,
  CloudBindingConfig,
  CloudBindingResult,
  CloudBindingValidationError
} from "@typespec/asyncapi/plugins"
import { getCloudBindingsByType } from "@typespec/asyncapi/decorators"

/**
 * Configuration interface for your plugin
 * 
 * Extend CloudBindingConfig with your specific configuration options
 */
export interface MyPluginConfig extends CloudBindingConfig {
  /** Required: Service endpoint URL */
  endpoint: string
  
  /** Optional: Request timeout in milliseconds (default: 5000) */
  timeout?: number
  
  /** Optional: Number of retry attempts (default: 3) */
  retries?: number
  
  /** Optional: Custom headers to include in requests */
  headers?: Record<string, string>
  
  /** Optional: Authentication configuration */
  auth?: {
    type: 'api-key' | 'bearer-token' | 'oauth' | 'basic'
    credentials: Record<string, unknown>
  }
  
  /** Optional: Rate limiting configuration */
  rateLimit?: {
    requestsPerSecond: number
    burstLimit: number
  }
  
  /** Optional: Message transformation settings */
  messageFormat?: {
    /** Message encoding format */
    encoding: 'json' | 'avro' | 'protobuf' | 'xml'
    /** Schema validation */
    validateSchema?: boolean
    /** Message compression */
    compression?: 'gzip' | 'lz4' | 'snappy'
  }
}

/**
 * My Custom AsyncAPI Plugin
 * 
 * This plugin demonstrates how to create a custom cloud binding plugin
 * for the TypeSpec AsyncAPI emitter. Replace this implementation with
 * your specific integration logic.
 * 
 * @example
 * ```typespec
 * @bindings("my-service", {
 *   endpoint: "https://api.myservice.com",
 *   timeout: 10000,
 *   auth: {
 *     type: "api-key",
 *     credentials: { key: "my-api-key" }
 *   }
 * })
 * @publish
 * op sendMessage(): MyMessage;
 * ```
 */
export class MyCustomPlugin extends BaseCloudBindingPlugin {
  readonly bindingType = 'my-service'
  readonly name = 'My Custom Service Plugin'
  readonly version = '1.0.0'
  readonly description = 'Custom integration plugin for My Service messaging platform'
  
  /**
   * Process bindings for operations and models
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    return Effect.gen(function* () {
      // Get all bindings of our type for this target
      const bindings = getCloudBindingsByType(context, target, this.bindingType)
      
      if (bindings.length === 0) {
        return this.createEmptyResult()
      }
      
      Effect.log(`🔗 Processing ${bindings.length} ${this.bindingType} bindings for ${target.name}`)
      
      const result = this.createEmptyResult()
      
      for (const binding of bindings) {
        // Validate and process each binding
        const config = yield* this.validateConfig(binding.config as MyPluginConfig)
        
        // Generate channel binding
        const channelBinding = yield* this.generateChannelBinding(config)
        const channelId = this.generateChannelId(config)
        
        // Add channel to result
        result.channels[channelId] = {
          address: this.extractServiceAddress(config),
          description: `${this.name} channel: ${config.endpoint}`,
          bindings: {
            [this.bindingType]: channelBinding
          }
        }
        
        // Generate operation binding for operations
        if (target.kind === 'Operation') {
          const operationBinding = yield* this.generateOperationBinding(config)
          const action = this.inferOperationAction(target.name)
          
          result.operations[target.name] = {
            action,
            channel: { $ref: `#/channels/${channelId}` },
            bindings: {
              [this.bindingType]: operationBinding
            }
          }
        }
        
        // Add authentication components if configured
        if (config.auth) {
          result.components = {
            ...result.components,
            ...yield* this.generateAuthComponents(config)
          }
        }
        
        Effect.log(`✅ Generated ${this.bindingType} binding for ${channelId}`)
      }
      
      return result
    }.bind(this))
  }
  
  /**
   * Validate plugin configuration
   */
  validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      yield* this.validateConfig(config as MyPluginConfig)
      yield* this.validateServiceConnection(config as MyPluginConfig)
      return true
    })
  }
  
  /**
   * Get plugin capabilities
   */
  getCapabilities(): Record<string, unknown> {
    return {
      protocols: ['http', 'https', 'websocket'],
      messageFormats: ['json', 'avro', 'protobuf', 'xml'],
      authenticationTypes: ['api-key', 'bearer-token', 'oauth', 'basic'],
      features: [
        'request-response',
        'publish-subscribe',
        'message-transformation',
        'rate-limiting',
        'retry-logic',
        'schema-validation',
        'compression-support'
      ],
      limitations: {
        maxMessageSize: 10485760, // 10MB
        maxRetries: 10,
        maxTimeout: 300000, // 5 minutes
        maxRateLimit: 10000 // requests per second
      }
    }
  }
  
  /**
   * Check if target is compatible with this plugin
   */
  isCompatible(target: Operation | Model): boolean {
    // This plugin supports both operations and models
    return target.kind === 'Operation' || target.kind === 'Model'
  }
  
  /**
   * Validate plugin configuration structure and values
   */
  private validateConfig(config: MyPluginConfig): Effect.Effect<MyPluginConfig, CloudBindingValidationError> {
    return Effect.gen(function* () {
      // Validate required fields
      if (!config.endpoint || typeof config.endpoint !== 'string') {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Endpoint URL is required',
          this.bindingType,
          'endpoint'
        ))
      }
      
      // Validate endpoint URL format
      try {
        new URL(config.endpoint)
      } catch {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Endpoint must be a valid URL',
          this.bindingType,
          'endpoint'
        ))
      }
      
      // Validate timeout
      if (config.timeout !== undefined) {
        if (typeof config.timeout !== 'number' || config.timeout < 0 || config.timeout > 300000) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Timeout must be a number between 0 and 300000 milliseconds',
            this.bindingType,
            'timeout'
          ))
        }
      }
      
      // Validate retries
      if (config.retries !== undefined) {
        if (typeof config.retries !== 'number' || config.retries < 0 || config.retries > 10) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Retries must be a number between 0 and 10',
            this.bindingType,
            'retries'
          ))
        }
      }
      
      // Validate authentication
      if (config.auth) {
        yield* this.validateAuthConfig(config.auth)
      }
      
      // Validate rate limiting
      if (config.rateLimit) {
        yield* this.validateRateLimitConfig(config.rateLimit)
      }
      
      // Validate message format
      if (config.messageFormat) {
        yield* this.validateMessageFormatConfig(config.messageFormat)
      }
      
      return config
    })
  }
  
  /**
   * Validate authentication configuration
   */
  private validateAuthConfig(auth: MyPluginConfig['auth']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!auth) return
      
      const validTypes = ['api-key', 'bearer-token', 'oauth', 'basic']
      if (!validTypes.includes(auth.type)) {
        return yield* Effect.fail(new CloudBindingValidationError(
          `Invalid auth type. Must be one of: ${validTypes.join(', ')}`,
          this.bindingType,
          'auth.type'
        ))
      }
      
      if (!auth.credentials || typeof auth.credentials !== 'object') {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Auth credentials are required',
          this.bindingType,
          'auth.credentials'
        ))
      }
    })
  }
  
  /**
   * Validate rate limiting configuration
   */
  private validateRateLimitConfig(rateLimit: MyPluginConfig['rateLimit']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!rateLimit) return
      
      if (rateLimit.requestsPerSecond < 1 || rateLimit.requestsPerSecond > 10000) {
        return yield* Effect.fail(new CloudBindingValidationError(
          'requestsPerSecond must be between 1 and 10000',
          this.bindingType,
          'rateLimit.requestsPerSecond'
        ))
      }
      
      if (rateLimit.burstLimit < 1) {
        return yield* Effect.fail(new CloudBindingValidationError(
          'burstLimit must be at least 1',
          this.bindingType,
          'rateLimit.burstLimit'
        ))
      }
    })
  }
  
  /**
   * Validate message format configuration
   */
  private validateMessageFormatConfig(messageFormat: MyPluginConfig['messageFormat']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!messageFormat) return
      
      const validEncodings = ['json', 'avro', 'protobuf', 'xml']
      if (!validEncodings.includes(messageFormat.encoding)) {
        return yield* Effect.fail(new CloudBindingValidationError(
          `Invalid encoding. Must be one of: ${validEncodings.join(', ')}`,
          this.bindingType,
          'messageFormat.encoding'
        ))
      }
      
      if (messageFormat.compression) {
        const validCompressions = ['gzip', 'lz4', 'snappy']
        if (!validCompressions.includes(messageFormat.compression)) {
          return yield* Effect.fail(new CloudBindingValidationError(
            `Invalid compression. Must be one of: ${validCompressions.join(', ')}`,
            this.bindingType,
            'messageFormat.compression'
          ))
        }
      }
    })
  }
  
  /**
   * Validate service connection (optional - for runtime validation)
   */
  private validateServiceConnection(config: MyPluginConfig): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // This is where you could add actual service connectivity checks
      // For example, making a health check request to the endpoint
      
      Effect.log(`🔍 Validating connection to ${config.endpoint}`)
      
      // Example: Simple connectivity check
      // In a real implementation, you might want to:
      // 1. Make a health check request
      // 2. Validate authentication
      // 3. Check service availability
      // 4. Verify permissions
      
      // For now, just log the validation
      Effect.log(`✅ Service connection validated for ${config.endpoint}`)
    })
  }
  
  /**
   * Generate channel binding configuration
   */
  private generateChannelBinding(config: MyPluginConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {
        endpoint: config.endpoint
      }
      
      if (config.timeout) {
        binding.timeout = config.timeout
      }
      
      if (config.retries) {
        binding.retries = config.retries
      }
      
      if (config.headers) {
        binding.headers = config.headers
      }
      
      if (config.rateLimit) {
        binding.rateLimit = config.rateLimit
      }
      
      if (config.messageFormat) {
        binding.messageFormat = config.messageFormat
      }
      
      return binding
    })
  }
  
  /**
   * Generate operation binding configuration
   */
  private generateOperationBinding(config: MyPluginConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {}
      
      // Operation-specific configurations can go here
      // For example: method, path, query parameters, etc.
      
      if (config.timeout) {
        binding.operationTimeout = config.timeout
      }
      
      return binding
    })
  }
  
  /**
   * Generate authentication components
   */
  private generateAuthComponents(config: MyPluginConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      if (!config.auth) {
        return {}
      }
      
      const securitySchemes: Record<string, unknown> = {}
      
      switch (config.auth.type) {
        case 'api-key':
          securitySchemes[`${this.bindingType}ApiKey`] = {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: `${this.name} API key authentication`
          }
          break
          
        case 'bearer-token':
          securitySchemes[`${this.bindingType}Bearer`] = {
            type: 'http',
            scheme: 'bearer',
            description: `${this.name} bearer token authentication`
          }
          break
          
        case 'oauth':
          securitySchemes[`${this.bindingType}OAuth`] = {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: `${config.endpoint}/oauth/token`,
                scopes: {}
              }
            },
            description: `${this.name} OAuth2 authentication`
          }
          break
          
        case 'basic':
          securitySchemes[`${this.bindingType}Basic`] = {
            type: 'http',
            scheme: 'basic',
            description: `${this.name} basic authentication`
          }
          break
      }
      
      return { securitySchemes }
    })
  }
  
  /**
   * Generate unique channel ID from configuration
   */
  private generateChannelId(config: MyPluginConfig): string {
    const url = new URL(config.endpoint)
    const hostname = url.hostname.replace(/[^a-zA-Z0-9]/g, '-')
    const pathname = url.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-|-$/g, '')
    
    return `${this.bindingType}-${hostname}${pathname ? `-${pathname}` : ''}`
  }
  
  /**
   * Extract service address from configuration
   */
  private extractServiceAddress(config: MyPluginConfig): string {
    return config.endpoint
  }
  
  /**
   * Infer operation action from operation name
   */
  private inferOperationAction(operationName: string): 'send' | 'receive' {
    const name = operationName.toLowerCase()
    
    // Send patterns
    if (name.includes('send') || name.includes('publish') || name.includes('post') || 
        name.includes('create') || name.includes('submit') || name.includes('emit')) {
      return 'send'
    }
    
    // Receive patterns
    if (name.includes('receive') || name.includes('subscribe') || name.includes('get') || 
        name.includes('fetch') || name.includes('poll') || name.includes('listen')) {
      return 'receive'
    }
    
    // Default to send for ambiguous cases
    return 'send'
  }
}

/**
 * Default plugin instance export
 */
export const myCustomPlugin = new MyCustomPlugin()

/**
 * Plugin factory function for advanced use cases
 */
export function createMyCustomPlugin(overrides?: Partial<MyCustomPlugin>): MyCustomPlugin {
  const plugin = new MyCustomPlugin()
  
  if (overrides) {
    Object.assign(plugin, overrides)
  }
  
  return plugin
}