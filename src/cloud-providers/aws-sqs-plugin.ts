import { Effect } from "effect"
import type { DecoratorContext, Operation, Model } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { BaseCloudBindingPlugin } from "../interfaces/cloud-binding-plugin.js"
import type { CloudBindingConfig, CloudBindingResult } from "../interfaces/cloud-binding-plugin.js"
import { CloudBindingValidationError } from "../interfaces/cloud-binding-plugin.js"
import { getCloudBindingsByType } from "../../decorators/cloud-bindings.js"

/**
 * AWS SQS-specific binding configuration
 */
export type AwsSqsBindingConfig = {
  /** SQS Queue URL or name */
  _queue: string
  
  /** Queue type */
  _queueType?: 'standard' | 'fifo'
  
  /** Message group ID for FIFO _queues */
  messageGroupId?: string
  
  /** Message deduplication ID for FIFO _queues */
  messageDeduplicationId?: string
  
  /** Visibility timeout in seconds (0-43200) */
  visibilityTimeoutSeconds?: number
  
  /** Message retention period in seconds (60-1209600) */
  messageRetentionPeriod?: number
  
  /** Maximum message size in bytes (1024-262144) */
  maxMessageSize?: number
  
  /** Dead letter _queue configuration */
  deadLetterQueue?: {
    targetArn: string
    maxReceiveCount: number
  }
  
  /** SQS receive configuration */
  receiveConfig?: {
    /** Maximum number of messages to receive at once (1-10) */
    maxNumberOfMessages?: number
    /** Long polling wait time in seconds (0-20) */
    waitTimeSeconds?: number
    /** Attributes to receive */
    attributeNames?: ('All' | 'ApproximateFirstReceiveTimestamp' | 'ApproximateReceiveCount' | 'SenderId' | 'SentTimestamp')[]
    /** Message attribute names to receive */
    messageAttributeNames?: string[]
  }
  
  /** Batch processing configuration */
  batchConfig?: {
    /** Batch size for batch operations */
    batchSize?: number
    /** Maximum batch wait time */
    batchWaitTimeMs?: number
  }
  
  /** Encryption configuration */
  encryption?: {
    /** KMS key ID for server-side encryption */
    kmsKeyId?: string
    /** KMS data key reuse period in seconds */
    kmsDataKeyReusePeriodSeconds?: number
  }
  
  /** Access policy configuration */
  policy?: {
    /** Queue policy document */
    policyDocument?: string
    /** Allowed principals */
    allowedPrincipals?: string[]
    /** Allowed actions */
    allowedActions?: string[]
  }
  
  /** Redrive policy for failed messages */
  redrivePolicy?: {
    deadLetterTargetArn: string
    maxReceiveCount: number
  }
} & CloudBindingConfig

/**
 * AWS SQS Plugin for TypeSpec AsyncAPI emitter
 * 
 * Provides comprehensive AWS SQS binding support with enterprise features:
 * - Standard and FIFO _queue support
 * - Dead letter _queue configuration  
 * - Message visibility and retention settings
 * - Batch processing configuration
 * - KMS encryption support
 * - Long polling configuration
 * - Cross-account access policies
 */
export class AwsSqsPlugin extends BaseCloudBindingPlugin {
  readonly bindingType = 'aws-sqs'
  readonly name = 'AWS SQS Plugin'
  readonly version = '1.0.0'
  readonly description = 'Enterprise-grade AWS Simple Queue Service binding support'
  
  /**
   * Process AWS SQS bindings for operations and models
   */
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    _asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    const self = this
    return Effect.gen(function* () {
      const sqsBindings = getCloudBindingsByType(context, target, 'aws-sqs')
      
      if (sqsBindings.length === 0) {
        return self.createEmptyResult()
      }
      
      Effect.log(`🔗 Processing ${sqsBindings.length} AWS SQS bindings for ${target.name}`)
      
      const result = self.createEmptyResult()
      
      for (const binding of sqsBindings) {
        const sqsConfig = yield* self.validateAwsSqsConfig(binding.config as AwsSqsBindingConfig)
        
        // Generate channel binding
        const channelBinding = yield* self.generateChannelBinding(sqsConfig)
        const channelId = self.extractChannelId(sqsConfig._queue)
        
        result.channels[channelId] = {
          address: sqsConfig._queue,
          description: `AWS SQS _queue: ${sqsConfig._queue}`,
          bindings: {
            sqs: channelBinding
          }
        }
        
        // Generate operation binding if target is Operation
        if (target.kind === 'Operation') {
          const operationBinding = yield* self.generateOperationBinding(sqsConfig)
          const action = self.inferOperationAction(target.name)
          
          result.operations[target.name] = {
            action,
            channel: { $ref: `#/channels/${channelId}` },
            bindings: {
              sqs: operationBinding
            }
          }
        }
        
        // Generate IAM policy components if configured
        if (sqsConfig.policy) {
          result.components = {
            ...result.components,
            ...yield* self.generateIamPolicyComponents(sqsConfig)
          }
        }
        
        Effect.log(`✅ Generated AWS SQS binding for ${channelId}`)
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
      yield* self.validateAwsCredentials(config)
      yield* self.validateAwsRegion(config)
      yield* self.validateSqsPermissions(config)
      return true
    })
  }
  
  /**
   * Get plugin capabilities and supported features
   */
  getCapabilities(): Record<string, unknown> {
    return {
      protocols: ['sqs'],
      messageFormats: ['json', 'string', 'binary'],
      _queueTypes: ['standard', 'fifo'],
      features: [
        '_queue-operations',
        'dead-letter-_queues',
        'message-visibility',
        'long-polling',
        'batch-operations',
        'encryption',
        'access-policies',
        'cross-account-access'
      ],
      authentication: ['iam-role', 'access-keys', 'sts-assume-role'],
      regions: 'all-aws-regions',
      limitations: {
        maxMessageSize: 262144, // 256 KB
        maxRetentionPeriod: 1209600, // 14 days
        maxVisibilityTimeout: 43200, // 12 hours
        maxBatchSize: 10
      }
    }
  }
  
  /**
   * Check target compatibility
   */
  isCompatible(target: Operation | Model): boolean {
    if (target.kind === 'Operation') {
      // SQS is compatible with both send (publish) and receive (subscribe) operations
      return true
    }
    
    if (target.kind === 'Model') {
      // Models can have SQS bindings for message-level configuration
      return true
    }
    
    return false
  }
  
  /**
   * Validate AWS SQS configuration structure
   */
  private validateAwsSqsConfig(config: AwsSqsBindingConfig): Effect.Effect<AwsSqsBindingConfig, CloudBindingValidationError> {
    const self = this
    return Effect.gen(function* () {
      if (!config._queue || typeof config._queue !== 'string') {
        return yield* Effect.fail(new CloudBindingValidationError(
          'Queue URL or name is required',
          self.bindingType,
          '_queue'
        ))
      }
      
      // Validate _queue URL format
      if (config._queue.startsWith('https://sqs.')) {
        const urlPattern = /^https:\/\/sqs\.[\w-]+\.amazonaws\.com\/\d+\/[\w-]+$/
        if (!urlPattern.test(config._queue)) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Invalid SQS _queue URL format',
            self.bindingType,
            '_queue'
          ))
        }
      }
      
      // Validate FIFO _queue requirements
      if (config._queueType === 'fifo' || config._queue.endsWith('.fifo')) {
        if (!config._queue.endsWith('.fifo')) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'FIFO _queue name must end with .fifo',
            self.bindingType,
            '_queue'
          ))
        }
        
        config._queueType = 'fifo' // Ensure type is set
      }
      
      // Validate numeric constraints
      if (config.visibilityTimeoutSeconds !== undefined) {
        if (config.visibilityTimeoutSeconds < 0 || config.visibilityTimeoutSeconds > 43200) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Visibility timeout must be between 0 and 43200 seconds',
            self.bindingType,
            'visibilityTimeoutSeconds'
          ))
        }
      }
      
      if (config.messageRetentionPeriod !== undefined) {
        if (config.messageRetentionPeriod < 60 || config.messageRetentionPeriod > 1209600) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Message retention period must be between 60 and 1209600 seconds',
            self.bindingType,
            'messageRetentionPeriod'
          ))
        }
      }
      
      if (config.maxMessageSize !== undefined) {
        if (config.maxMessageSize < 1024 || config.maxMessageSize > 262144) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'Maximum message size must be between 1024 and 262144 bytes',
            self.bindingType,
            'maxMessageSize'
          ))
        }
      }
      
      // Validate receive configuration
      if (config.receiveConfig) {
        yield* self.validateReceiveConfig(config.receiveConfig)
      }
      
      // Validate batch configuration
      if (config.batchConfig) {
        yield* self.validateBatchConfig(config.batchConfig)
      }
      
      return config
    })
  }
  
  /**
   * Generate AWS SQS channel binding
   */
  private generateChannelBinding(config: AwsSqsBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    const self = this
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {
        _queue: self.extractQueueName(config._queue)
      }
      
      if (config._queueType) {
        binding._queueType = config._queueType
      }
      
      if (config.messageRetentionPeriod) {
        binding.messageRetentionPeriod = config.messageRetentionPeriod
      }
      
      if (config.visibilityTimeoutSeconds) {
        binding.visibilityTimeout = config.visibilityTimeoutSeconds
      }
      
      if (config.deadLetterQueue) {
        binding.deadLetterQueue = config.deadLetterQueue
      }
      
      if (config.encryption) {
        binding.encryption = config.encryption
      }
      
      return binding
    })
  }
  
  /**
   * Generate AWS SQS operation binding
   */
  private generateOperationBinding(config: AwsSqsBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      const binding: Record<string, unknown> = {}
      
      if (config.messageGroupId) {
        binding.messageGroupId = config.messageGroupId
      }
      
      if (config.messageDeduplicationId) {
        binding.messageDeduplicationId = config.messageDeduplicationId
      }
      
      if (config.receiveConfig) {
        binding.receive = config.receiveConfig
      }
      
      if (config.batchConfig) {
        binding.batch = config.batchConfig
      }
      
      return binding
    })
  }
  
  /**
   * Generate IAM policy components
   */
  private generateIamPolicyComponents(config: AwsSqsBindingConfig): Effect.Effect<Record<string, unknown>, never> {
    return Effect.gen(function* () {
      if (!config.policy) {
        return {}
      }
      
      return {
        securitySchemes: {
          sqsIamRole: {
            type: 'aws-iam',
            description: 'AWS IAM role-based authentication for SQS access',
            'x-amazon-apigateway-authtype': 'aws_iam'
          }
        }
      }
    })
  }
  
  /**
   * Validate AWS credentials configuration
   */
  private validateAwsCredentials(config: Record<string, unknown>): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      const hasAccessKeys = config.accessKeyId && config.secretAccessKey
      const hasRoleArn = config.roleArn
      const hasProfile = config.profile
      
      if (!hasAccessKeys && !hasRoleArn && !hasProfile && !process.env.AWS_ACCESS_KEY_ID) {
        return yield* Effect.fail(new CloudBindingValidationError(
          'AWS credentials must be configured via access keys, IAM role, profile, or environment variables',
          self.bindingType,
          'credentials'
        ))
      }
    })
  }
  
  /**
   * Validate AWS region configuration
   */
  private validateAwsRegion(config: Record<string, unknown>): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      if (config.region && typeof config.region === 'string') {
        Effect.log(`🌍 Using AWS region: ${config.region}`)
      } else {
        Effect.log(`⚠️ No AWS region specified, using default or environment region`)
      }
    })
  }
  
  /**
   * Validate SQS permissions
   */
  private validateSqsPermissions(config: Record<string, unknown>): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      const requiredPermissions = [
        'sqs:SendMessage',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
        'sqs:GetQueueUrl'
      ]
      
      Effect.log(`📋 Required AWS SQS permissions: ${requiredPermissions.join(', ')}`)
    })
  }
  
  /**
   * Validate receive configuration
   */
  private validateReceiveConfig(config: AwsSqsBindingConfig['receiveConfig']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!_config) return
      
      if (config.maxNumberOfMessages !== undefined) {
        if (config.maxNumberOfMessages < 1 || config.maxNumberOfMessages > 10) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'maxNumberOfMessages must be between 1 and 10',
            self.bindingType,
            'receiveConfig.maxNumberOfMessages'
          ))
        }
      }
      
      if (config.waitTimeSeconds !== undefined) {
        if (config.waitTimeSeconds < 0 || config.waitTimeSeconds > 20) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'waitTimeSeconds must be between 0 and 20',
            self.bindingType,
            'receiveConfig.waitTimeSeconds'
          ))
        }
      }
    })
  }
  
  /**
   * Validate batch configuration
   */
  private validateBatchConfig(_config: AwsSqsBindingConfig['batchConfig']): Effect.Effect<void, CloudBindingValidationError> {
    return Effect.gen(function* () {
      if (!_config) return
      
      if (_config.batchSize !== undefined) {
        if (_config.batchSize < 1 || _config.batchSize > 10) {
          return yield* Effect.fail(new CloudBindingValidationError(
            'batchSize must be between 1 and 10',
            self.bindingType,
            'batchConfig.batchSize'
          ))
        }
      }
    })
  }
  
  /**
   * Extract channel ID from SQS _queue URL or name
   */
  private extractChannelId(__queue: string): string {
    if (_queue.startsWith('https://sqs.')) {
      const parts = _queue.split('/')
      return `sqs-${parts[parts.length - 1]}`
    }
    return `sqs-${_queue}`
  }
  
  /**
   * Extract _queue name from SQS _queue URL or name
   */
  private extractQueueName(__queue: string): string {
    if (_queue.startsWith('https://sqs.')) {
      const parts = _queue.split('/')
      return parts[parts.length - 1]
    }
    return _queue
  }
  
  /**
   * Infer operation action from operation name
   */
  private inferOperationAction(__operationName: string): 'send' | 'receive' {
    const name = _operationName.toLowerCase()
    if (name.includes('send') || name.includes('publish') || name.includes('en_queue')) {
      return 'send'
    }
    if (name.includes('receive') || name.includes('subscribe') || name.includes('de_queue') || name.includes('poll')) {
      return 'receive'
    }
    // Default to send for SQS operations
    return 'send'
  }
}

/**
 * Default AWS SQS plugin instance
 */
export const awsSqsPlugin = new AwsSqsPlugin()