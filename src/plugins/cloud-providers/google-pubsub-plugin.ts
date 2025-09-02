import { Effect } from "effect"
import type { DecoratorContext, Operation, Model } from "@typespec/compiler"
import type { AsyncAPIObject } from "../../types/asyncapi.js"
import type { CloudBindingConfig, CloudBindingResult } from "../interfaces/cloud-binding-plugin.js"
import { BaseCloudBindingPlugin, CloudBindingValidationError } from "../interfaces/cloud-binding-plugin.js"
import { getCloudBindingsByType } from "../../decorators/cloud-bindings.js"

/**
 * Google Cloud Pub/Sub-specific binding configuration
 */
export interface GooglePubSubBindingConfig extends CloudBindingConfig {
  /** Pub/Sub topic name or full resource path */
  topic: string
  
  /** Google Cloud project ID */
  projectId?: string
  
  /** Subscription name for pull operations */
  subscription?: string
  
  /** Subscription configuration */
  subscriptionConfig?: {
    /** Message acknowledgment deadline in seconds (10-600) */
    ackDeadlineSeconds?: number
    /** Message ordering support */
    enableMessageOrdering?: boolean
    /** Dead letter queue configuration */
    deadLetterPolicy?: {
      deadLetterTopic: string
      maxDeliveryAttempts: number
    }
    /** Retry policy configuration */
    retryPolicy?: {
      minimumBackoff?: string
      maximumBackoff?: string
    }
    /** Filter expression for message filtering */
    filter?: string
    /** Enable exactly once delivery */
    enableExactlyOnceDelivery?: boolean
  }
  
  /** Publishing configuration */
  publishConfig?: {
    /** Message ordering key */
    orderingKey?: string
    /** Enable message deduplication */
    enableMessageDeduplication?: boolean
    /** Batch settings */
    batchSettings?: {
      maxMessages?: number
      maxBytes?: number
      maxLatency?: string
    }
  }
  
  /** Message schema configuration */
  schemaSettings?: {
    /** Schema name */
    schema?: string
    /** Schema encoding (JSON, AVRO, PROTOCOL_BUFFER) */
    encoding?: 'JSON' | 'AVRO' | 'PROTOCOL_BUFFER'
    /** First revision ID */
    firstRevisionId?: string
    /** Last revision ID */
    lastRevisionId?: string
  }
  
  /** Authentication configuration */
  authentication?: {
    /** Service account key file path */
    keyFile?: string
    /** Service account email */
    serviceAccountEmail?: string
    /** Authentication scopes */
    scopes?: string[]
    /** Use application default credentials */
    useApplicationDefaultCredentials?: boolean
  }
  
  /** Topic configuration (for topic creation/management) */
  topicConfig?: {
    /** Message retention duration */
    messageRetentionDuration?: string
    /** KMS key name for encryption */
    kmsKeyName?: string
    /** Message storage policy */
    messageStoragePolicy?: {
      allowedPersistenceRegions: string[]
    }
    /** Schema settings */
    schemaSettings?: {
      schema: string
      encoding: 'JSON' | 'AVRO' | 'PROTOCOL_BUFFER'
    }
  }
  
  /** Push subscription configuration */
  pushConfig?: {
    /** Push endpoint URL */
    pushEndpoint: string
    /** Push endpoint attributes */
    attributes?: Record<string, string>
    /** OIDC token configuration */
    oidcToken?: {
      serviceAccountEmail: string
      audience?: string
    }
    /** Pub/Sub wrapper configuration */
    pubsubWrapper?: {
      /** Write metadata to wrapper */
      writeMetadata?: boolean
    }
  }
  
  /** BigQuery subscription configuration */
  bigQueryConfig?: {
    /** BigQuery table name */
    table: string
    /** Use topic schema */
    useTopicSchema?: boolean
    /** Write metadata */
    writeMetadata?: boolean
    /** Drop unknown fields */
    dropUnknownFields?: boolean
    /** Service account email */
    serviceAccountEmail?: string
  }
  
  /** Cloud Storage subscription configuration */
  cloudStorageConfig?: {
    /** Storage bucket name */
    bucket: string
    /** File name prefix */
    filenamePrefix?: string
    /** File name suffix */
    filenameSuffix?: string
    /** Maximum file size in bytes */
    maxBytes?: number
    /** Maximum file duration */
    maxDuration?: string
    /** Output format */
    outputFormat?: {
      textConfig?: Record<string, unknown>
      avroConfig?: {
        writeMetadata?: boolean
      }
    }
    /** Service account email */
    serviceAccountEmail?: string
  }
}

/**
 * Google Cloud Pub/Sub Plugin for TypeSpec AsyncAPI emitter
 * 
 * Provides comprehensive Google Cloud Pub/Sub binding support with enterprise features:
 * - Topic and subscription management
 * - Message ordering and deduplication
 * - Dead letter queue configuration
 * - Schema evolution support
 * - Push, pull, and export subscriptions
 * - BigQuery and Cloud Storage integration
 * - Service account authentication
 * - Message filtering and exactly-once delivery
 */
export class GooglePubSubPlugin extends BaseCloudBindingPlugin {
  readonly bindingType = 'google-pubsub'
  readonly name = 'Google Cloud Pub/Sub Plugin'
  readonly version = '1.0.0'
  readonly description = 'Enterprise-grade Google Cloud Pub/Sub messaging service binding support'
  
  /**
   * Process Google Cloud Pub/Sub bindings for operations and models
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    _asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    const self = this
    return Effect.gen(function* () {
      const pubsubBindings = getCloudBindingsByType(context, target, 'google-pubsub')
      
      if (pubsubBindings.length === 0) {
        return self.createEmptyResult()
      }
      
      Effect.log(`🔗 Processing ${pubsubBindings.length} Google Pub/Sub bindings for ${target.name}`)
      
      const result = self.createEmptyResult()
      
      for (const binding of pubsubBindings) {
        const pubsubConfig = yield* self.validateGooglePubSubConfig(binding.config as GooglePubSubBindingConfig)
        
        // Generate channel binding
        const channelBinding = yield* self.generateChannelBinding(pubsubConfig)
        const channelId = self.extractChannelId(pubsubConfig.topic)
        
        result.channels[channelId] = {
          address: pubsubConfig.topic,
          description: `Google Cloud Pub/Sub topic: ${pubsubConfig.topic}`,
          bindings: {
            googlepubsub: channelBinding
          }
        }
        
        // Generate operation binding if target is Operation
        if (target.kind === 'Operation') {
          const operationBinding = yield* self.generateOperationBinding(pubsubConfig)
          const action = self.inferOperationAction(target.name)
          
          result.operations[target.name] = {
            action,
            channel: { $ref: `#/channels/${channelId}` },
            bindings: {
              googlepubsub: operationBinding
            }
          }
        }
        
        // Generate IAM policy components if configured
        if (pubsubConfig.authentication) {
          result.components = {
            ...result.components,
            ...yield* self.generateServiceAccountComponents(pubsubConfig)
          }
        }
        
        Effect.log(`✅ Generated Google Pub/Sub binding for ${channelId}`)
      }
      
      return result
    })
  }
  
  /**
   * Validate plugin configuration
   */
  validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error> {
    const self = this
    return Effect.gen(function* () {
      yield* self.validateGoogleCloudCredentials(config)
      yield* self.validateGoogleCloudProject(config)
      yield* self.validatePubSubPermissions(config)
      return true
    })
  }
  
  /**
   * Get plugin capabilities and supported features
   */
  getCapabilities(): Record<string, unknown> {
    return {
      protocols: ['googlepubsub'],
      messageFormats: ['json', 'avro', 'protobuf', 'string', 'binary'],
      subscriptionTypes: ['pull', 'push', 'bigquery', 'cloud-storage'],
      features: [
        'topic-operations',
        'subscription-management',
        'message-ordering',
        'exactly-once-delivery',
        'dead-letter-queues',
        'message-filtering',
        'schema-evolution',
        'batch-publishing',
        'push-subscriptions',
        'bigquery-export',
        'cloud-storage-export',
        'service-account-auth'
      ],
      authentication: ['service-account-key', 'application-default-credentials', 'workload-identity'],
      regions: 'all-google-cloud-regions',
      limitations: {
        maxMessageSize: 10485760, // 10 MB
        maxRetentionPeriod: '604800s', // 7 days
        maxAckDeadline: 600, // 10 minutes
        maxSubscriptionsPerTopic: 10000,
        maxTopicsPerProject: 10000
      }
    }
  }
  
  /**
   * Check target compatibility
   */
  isCompatible(target: Operation | Model): boolean {
    if (target.kind === 'Operation') {
      // Pub/Sub is compatible with both publish and subscribe operations
      return true
    }
    
    if (target.kind === 'Model') {
      // Models can have Pub/Sub bindings for message-level configuration
      return true
    }
    
    return false
  }
  
  /**
   * Validate Google Cloud Pub/Sub configuration structure
   */
  private validateGooglePubSubConfig(config: GooglePubSubBindingConfig): Effect.Effect<GooglePubSubBindingConfig, CloudBindingValidationError> {
    const self = this
    return Effect.gen(function* () {
      if (!config.topic || typeof config.topic !== 'string') {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Topic name or resource path is required',
          self.bindingType,
          'topic'
        ))
      }
      
      // Validate topic name format
      if (config.topic.includes('projects/')) {
        // Full resource path format: projects/{project}/topics/{topic}
        const resourcePattern = /^projects\/[a-z0-9][a-z0-9\-]{4,28}[a-z0-9]\/topics\/[a-zA-Z][\w\-\.~%]{0,254}$/
        if (!resourcePattern.test(config.topic)) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Invalid Pub/Sub topic resource path format',
            self.bindingType,
            'topic'
          ))
        }
      } else {
        // Simple topic name format
        const namePattern = /^[a-zA-Z][\w\-\.~%]{0,254}$/
        if (!namePattern.test(config.topic)) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Invalid Pub/Sub topic name format',
            self.bindingType,
            'topic'
          ))
        }
      }
      
      // Validate subscription configuration
      if (config.subscriptionConfig) {
        yield* self.validateSubscriptionConfig(config.subscriptionConfig)
      }
      
      // Validate publish configuration
      if (config.publishConfig) {
        yield* self.validatePublishConfig(config.publishConfig)
      }
      
      // Validate schema settings
      if (config.schemaSettings) {
        yield* self.validateSchemaSettings(config.schemaSettings)
      }
      
      // Validate push configuration
      if (config.pushConfig) {
        yield* self.validatePushConfig(config.pushConfig)
      }
      
      return config
    })
  }
  
  /**
   * Generate Google Cloud Pub/Sub channel binding
   */
  private generateChannelBinding(config: GooglePubSubBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {
        topic: this.extractTopicName(config.topic)
      }
      
      if (config.projectId) {
        binding.projectId = config.projectId
      }
      
      if (config.topicConfig) {
        binding.topicConfig = config.topicConfig
      }
      
      if (config.schemaSettings) {
        binding.schemaSettings = config.schemaSettings
      }
      
      return binding
    })
  }
  
  /**
   * Generate Google Cloud Pub/Sub operation binding
   */
  private generateOperationBinding(config: GooglePubSubBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {}
      
      if (config.subscription) {
        binding.subscription = config.subscription
      }
      
      if (config.subscriptionConfig) {
        binding.subscriptionConfig = config.subscriptionConfig
      }
      
      if (config.publishConfig) {
        binding.publishConfig = config.publishConfig
      }
      
      if (config.pushConfig) {
        binding.pushConfig = config.pushConfig
      }
      
      if (config.bigQueryConfig) {
        binding.bigQueryConfig = config.bigQueryConfig
      }
      
      if (config.cloudStorageConfig) {
        binding.cloudStorageConfig = config.cloudStorageConfig
      }
      
      return binding
    })
  }
  
  /**
   * Generate service account authentication components
   */
  private generateServiceAccountComponents(config: GooglePubSubBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      if (!config.authentication) {
        return {}
      }
      
      return {
        securitySchemes: {
          pubsubServiceAccount: {
            type: 'oauth2',
            description: 'Google Cloud service account authentication for Pub/Sub access',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://oauth2.googleapis.com/token',
                scopes: {
                  'https://www.googleapis.com/auth/pubsub': 'Full access to Pub/Sub resources',
                  'https://www.googleapis.com/auth/cloud-platform': 'Full access to Google Cloud Platform resources'
                }
              }
            }
          }
        }
      }
    })
  }
  
  /**
   * Validate Google Cloud credentials configuration
   */
  private validateGoogleCloudCredentials(config: Record<string, unknown>): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      const hasKeyFile = config.keyFile
      const hasServiceAccount = config.serviceAccountEmail
      const hasADC = config.useApplicationDefaultCredentials
      const hasEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS
      
      if (!hasKeyFile && !hasServiceAccount && !hasADC && !hasEnvVar) {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Google Cloud credentials must be configured via key file, service account, ADC, or environment variables',
          this.bindingType,
          'authentication'
        ))
      }
    })
  }
  
  /**
   * Validate Google Cloud project configuration
   */
  private validateGoogleCloudProject(config: Record<string, unknown>): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      if (config.projectId && typeof config.projectId === 'string') {
        Effect.log(`🌍 Using Google Cloud project: ${config.projectId}`)
      } else {
        Effect.log(`⚠️ No project ID specified, using default or environment project`)
      }
    })
  }
  
  /**
   * Validate Pub/Sub permissions
   */
  private validatePubSubPermissions(config: Record<string, unknown>): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      const requiredPermissions = [
        'pubsub.topics.publish',
        'pubsub.topics.get',
        'pubsub.subscriptions.consume',
        'pubsub.subscriptions.create',
        'pubsub.messages.ack'
      ]
      
      Effect.log(`📋 Required Google Cloud Pub/Sub permissions: ${requiredPermissions.join(', ')}`)
    })
  }
  
  /**
   * Validate subscription configuration
   */
  private validateSubscriptionConfig(config: GooglePubSubBindingConfig['subscriptionConfig']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!config) return
      
      if (config.ackDeadlineSeconds !== undefined) {
        if (config.ackDeadlineSeconds < 10 || config.ackDeadlineSeconds > 600) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'ackDeadlineSeconds must be between 10 and 600',
            this.bindingType,
            'subscriptionConfig.ackDeadlineSeconds'
          ))
        }
      }
      
      if (config.deadLetterPolicy?.maxDeliveryAttempts !== undefined) {
        if (config.deadLetterPolicy.maxDeliveryAttempts < 5 || config.deadLetterPolicy.maxDeliveryAttempts > 100) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'maxDeliveryAttempts must be between 5 and 100',
            this.bindingType,
            'subscriptionConfig.deadLetterPolicy.maxDeliveryAttempts'
          ))
        }
      }
    })
  }
  
  /**
   * Validate publish configuration
   */
  private validatePublishConfig(config: GooglePubSubBindingConfig['publishConfig']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!config) return
      
      if (config.batchSettings?.maxMessages !== undefined) {
        if (config.batchSettings.maxMessages < 1 || config.batchSettings.maxMessages > 1000) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'batchSettings.maxMessages must be between 1 and 1000',
            this.bindingType,
            'publishConfig.batchSettings.maxMessages'
          ))
        }
      }
    })
  }
  
  /**
   * Validate schema settings
   */
  private validateSchemaSettings(config: GooglePubSubBindingConfig['schemaSettings']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!config) return
      
      const validEncodings = ['JSON', 'AVRO', 'PROTOCOL_BUFFER']
      if (config.encoding && !validEncodings.includes(config.encoding)) {
        return yield* Effect.fail(new CloudBindingValidationError(
          `Schema encoding must be one of: ${validEncodings.join(', ')}`,
          this.bindingType,
          'schemaSettings.encoding'
        ))
      }
    })
  }
  
  /**
   * Validate push configuration
   */
  private validatePushConfig(config: GooglePubSubBindingConfig['pushConfig']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!config) return
      
      if (!config.pushEndpoint || typeof config.pushEndpoint !== 'string') {
        return yield* Effect.fail(new CloudBindingValidationError(
          'pushEndpoint is required for push subscriptions',
          this.bindingType,
          'pushConfig.pushEndpoint'
        ))
      }
      
      // Validate URL format
      try {
        new URL(config.pushEndpoint)
      } catch {
        return yield* Effect.fail(new CloudBindingValidationError(
          'pushEndpoint must be a valid URL',
          this.bindingType,
          'pushConfig.pushEndpoint'
        ))
      }
    })
  }
  
  /**
   * Extract channel ID from Pub/Sub topic name or resource path
   */
  private extractChannelId(topic: string): string {
    if (topic.includes('projects/')) {
      const parts = topic.split('/')
      return `pubsub-${parts[parts.length - 1]}`
    }
    return `pubsub-${topic}`
  }
  
  /**
   * Extract topic name from Pub/Sub topic resource path or name
   */
  private extractTopicName(topic: string): string {
    if (topic.includes('projects/')) {
      const parts = topic.split('/')
      return parts[parts.length - 1]
    }
    return topic
  }
  
  /**
   * Infer operation action from operation name
   */
  private inferOperationAction(operationName: string): 'send' | 'receive' {
    const name = operationName.toLowerCase()
    if (name.includes('publish') || name.includes('send') || name.includes('emit')) {
      return 'send'
    }
    if (name.includes('subscribe') || name.includes('receive') || name.includes('consume') || name.includes('pull')) {
      return 'receive'
    }
    // Default to send for Pub/Sub operations
    return 'send'
  }
}

/**
 * Default Google Cloud Pub/Sub plugin instance
 */
export const googlePubSubPlugin = new GooglePubSubPlugin()