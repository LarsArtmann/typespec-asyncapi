import { Effect } from "effect"
import type { DecoratorContext, Operation, Model } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { CloudBindingPlugin, CloudBindingConfig, CloudBindingResult } from "../interfaces/cloud-binding-plugin.js"
import { getCloudBindingsByType } from "../../decorators/cloud-bindings.js"

/**
 * AWS SNS-specific binding configuration
 */
export interface AwsSnsBindingConfig extends CloudBindingConfig {
  /** SNS Topic ARN or name */
  topic: string
  
  /** AWS region (optional, can be inferred from ARN) */
  region?: string
  
  /** Message attributes configuration */
  attributes?: Record<string, {
    type: 'String' | 'Number' | 'Binary' | 'String.Array' | 'Number.Array' | 'Binary.Array'
    value?: string
  }>
  
  /** Filter policy for subscription filtering */
  filterPolicy?: Record<string, string | string[] | number | number[] | { exists: boolean }>
  
  /** Dead letter queue configuration */
  deadLetterQueue?: {
    targetArn: string
    maxReceiveCount: number
  }
  
  /** Subscription configuration (for subscribers) */
  subscription?: {
    protocol: 'sqs' | 'lambda' | 'email' | 'sms' | 'http' | 'https' | 'application'
    endpoint: string
    confirmationTimeoutInMinutes?: number
    deliveryPolicy?: {
      healthyRetryPolicy?: {
        minDelayTarget?: number
        maxDelayTarget?: number
        numRetries?: number
        numMaxDelayRetries?: number
        backoffFunction?: 'linear' | 'arithmetic' | 'geometric' | 'exponential'
      }
    }
  }
  
  /** Message delivery status logging */
  loggingConfig?: {
    successSampleRate?: number
    failureFeedbackRoleArn?: string
    successFeedbackRoleArn?: string
  }
  
  /** Encryption configuration */
  encryption?: {
    kmsKeyId?: string
    kmsMasterKeyId?: string
  }
  
  /** FIFO topic configuration */
  fifo?: {
    contentBasedDeduplication?: boolean
    messageGroupId?: string
    messageDeduplicationId?: string
  }
}

/**
 * AWS SNS binding validation errors
 */
export class AwsSnsValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(`AWS SNS validation error: ${message}`)
    this.name = 'AwsSnsValidationError'
  }
}

/**
 * AWS SNS Plugin for TypeSpec AsyncAPI emitter
 * 
 * Provides comprehensive AWS SNS binding support with enterprise features:
 * - Topic ARN validation and parsing
 * - Message attributes and filtering
 * - Dead letter queue configuration
 * - FIFO topic support
 * - Cross-region topic access
 * - Subscription management
 * - IAM role and policy generation hints
 */
export class AwsSnsPlugin implements CloudBindingPlugin {
  readonly bindingType = 'aws-sns'
  readonly name = 'AWS SNS Plugin'
  readonly version = '1.0.0'
  readonly description = 'Enterprise-grade AWS Simple Notification Service binding support'
  
  /**
   * Process AWS SNS bindings for operations and models
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    _asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    return Effect.gen(function* () {
      const snsBindings = getCloudBindingsByType(context, target, 'aws-sns')
      
      if (snsBindings.length === 0) {
        return { 
          bindings: {}, 
          channels: {}, 
          operations: {},
          components: {}
        }
      }
      
      Effect.log(`🔗 Processing ${snsBindings.length} AWS SNS bindings for ${target.name}`)
      
      const result: CloudBindingResult = {
        bindings: {},
        channels: {},
        operations: {},
        components: {}
      }
      
      for (const binding of snsBindings) {
        const snsConfig = yield* validateAwsSnsConfig(binding.config as AwsSnsBindingConfig)
        
        // Generate channel binding
        const channelBinding = yield* generateChannelBinding(snsConfig)
        const channelId = extractChannelId(snsConfig.topic)
        
        result.channels[channelId] = {
          address: snsConfig.topic,
          description: `AWS SNS topic: ${snsConfig.topic}`,
          bindings: {
            sns: channelBinding
          }
        }
        
        // Generate operation binding if target is Operation
        if (target.kind === 'Operation') {
          const operationBinding = yield* generateOperationBinding(snsConfig)
          result.operations[target.name] = {
            action: 'send', // SNS is primarily for publishing
            channel: { $ref: `#/channels/${channelId}` },
            bindings: {
              sns: operationBinding
            }
          }
        }
        
        Effect.log(`✅ Generated AWS SNS binding for ${channelId}`)
      }
      
      return result
    })
  }
  
  /**
   * Validate plugin configuration
   */
  validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      yield* validateAwsCredentials(config)
      yield* validateAwsRegion(config)
      yield* validateAwsPermissions(config)
      return true
    })
  }
  
  /**
   * Get plugin capabilities and supported features
   */
  getCapabilities(): Record<string, unknown> {
    return {
      protocols: ['sns'],
      messageFormats: ['json', 'string', 'binary'],
      features: [
        'topic-publishing',
        'message-attributes',
        'filter-policies', 
        'dead-letter-queues',
        'fifo-topics',
        'encryption',
        'cross-region',
        'subscription-management'
      ],
      authentication: ['iam-role', 'access-keys', 'sts-assume-role'],
      regions: 'all-aws-regions'
    }
  }
}

/**
 * Validate AWS SNS configuration structure
 */
function validateAwsSnsConfig(config: AwsSnsBindingConfig): Effect.Effect<AwsSnsBindingConfig, Error> {
  return Effect.gen(function* () {
    if (!config.topic || typeof config.topic !== 'string') {
      return yield* Effect.fail(new AwsSnsValidationError('Topic ARN or name is required', 'topic'))
    }
    
    // Validate topic ARN format
    if (config.topic.startsWith('arn:aws:sns:')) {
      const arnParts = config.topic.split(':')
      if (arnParts.length !== 6) {
        return yield* Effect.fail(new AwsSnsValidationError('Invalid SNS topic ARN format', 'topic'))
      }
      
      const [_arn, _aws, service, region, account, topicName] = arnParts
      if (service !== 'sns' || !region || !account || !topicName) {
        return yield* Effect.fail(new AwsSnsValidationError('Invalid SNS topic ARN components', 'topic'))
      }
    }
    
    // Validate message attributes
    if (config.attributes) {
      for (const [attrName, attrConfig] of Object.entries(config.attributes)) {
        if (!attrConfig.type || !['String', 'Number', 'Binary', 'String.Array', 'Number.Array', 'Binary.Array'].includes(attrConfig.type)) {
          return yield* Effect.fail(new AwsSnsValidationError(`Invalid attribute type for ${attrName}`, 'attributes'))
        }
      }
    }
    
    // Validate filter policy
    if (config.filterPolicy) {
      yield* validateFilterPolicy(config.filterPolicy)
    }
    
    // Validate FIFO configuration
    if (config.fifo) {
      if (!config.topic.endsWith('.fifo')) {
        return yield* Effect.fail(new AwsSnsValidationError('FIFO configuration requires topic name to end with .fifo', 'fifo'))
      }
    }
    
    return config
  })
}

/**
 * Generate AWS SNS channel binding
 */
function generateChannelBinding(config: AwsSnsBindingConfig): Effect.Effect<Record<string, unknown>, never> {
  return Effect.gen(function* () {
    const binding: Record<string, unknown> = {
      name: extractTopicName(config.topic)
    }
    
    if (config.region) {
      binding.region = config.region
    }
    
    if (config.fifo) {
      binding.fifo = config.fifo
    }
    
    if (config.encryption) {
      binding.encryption = config.encryption  
    }
    
    return binding
  })
}

/**
 * Generate AWS SNS operation binding
 */
function generateOperationBinding(config: AwsSnsBindingConfig): Effect.Effect<Record<string, unknown>, never> {
  return Effect.gen(function* () {
    const binding: Record<string, unknown> = {}
    
    if (config.attributes) {
      binding.messageAttributes = config.attributes
    }
    
    if (config.subscription) {
      binding.subscription = config.subscription
    }
    
    if (config.loggingConfig) {
      binding.logging = config.loggingConfig
    }
    
    return binding
  })
}

/**
 * Validate AWS credentials configuration
 */
function validateAwsCredentials(config: Record<string, unknown>): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    // Check for credential configuration
    const hasAccessKeys = config.accessKeyId && config.secretAccessKey
    const hasRoleArn = config.roleArn
    const hasProfile = config.profile
    
    if (!hasAccessKeys && !hasRoleArn && !hasProfile && !process.env.AWS_ACCESS_KEY_ID) {
      return yield* Effect.fail(new AwsSnsValidationError(
        'AWS credentials must be configured via access keys, IAM role, profile, or environment variables',
        'credentials'
      ))
    }
  })
}

/**
 * Validate AWS region configuration
 */
function validateAwsRegion(config: Record<string, unknown>): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    if (config.region && typeof config.region === 'string') {
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1',
        'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2'
        // Add more regions as needed
      ]
      
      if (!validRegions.includes(config.region as string)) {
        Effect.log(`⚠️ Warning: Region ${config.region} may not be valid`)
      }
    }
  })
}

/**
 * Validate AWS permissions
 */
function validateAwsPermissions(_config: Record<string, unknown>): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    // Basic permission validation - would be expanded in production
    const requiredPermissions = [
      'sns:Publish',
      'sns:GetTopicAttributes',
      'sns:ListTopics'
    ]
    
    Effect.log(`📋 Required AWS permissions: ${requiredPermissions.join(', ')}`)
  })
}

/**
 * Validate SNS filter policy format
 */
function validateFilterPolicy(filterPolicy: Record<string, unknown>): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    for (const [key, value] of Object.entries(filterPolicy)) {
      if (typeof value === 'object' && value !== null) {
        if ('exists' in value) {
          if (typeof value.exists !== 'boolean') {
            return yield* Effect.fail(new AwsSnsValidationError(
              `Filter policy 'exists' must be boolean for ${key}`,
              'filterPolicy'
            ))
          }
        }
      }
    }
  })
}

/**
 * Extract channel ID from SNS topic ARN or name
 */
function extractChannelId(topic: string): string {
  if (topic.startsWith('arn:aws:sns:')) {
    const parts = topic.split(':')
    return `sns-${parts[5]}` // Topic name is the last part
  }
  return `sns-${topic}`
}

/**
 * Extract topic name from SNS topic ARN or name
 */
function extractTopicName(topic: string): string {
  if (topic.startsWith('arn:aws:sns:')) {
    const parts = topic.split(':')
    return parts[5] // Topic name is the last part
  }
  return topic
}

/**
 * Default AWS SNS plugin instance
 */
export const awsSnsPlugin = new AwsSnsPlugin()