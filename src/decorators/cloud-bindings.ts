import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"

/**
 * Supported cloud binding types
 */
export type CloudBindingType = 
	| 'kafka'
	| 'amqp'
	| 'websocket'
	| 'aws-sns'
	| 'aws-sqs'
	| 'gcp-pubsub'
	| 'azure-servicebus'
	| 'redis'
	| 'pulsar'

/**
 * AWS SNS binding configuration
 */
export type AwsSnsBindingConfig = {
	/** Topic ARN or name */
	topic: string;
	/** AWS region */
	region?: string;
	/** Message attributes configuration */
	attributes?: Record<string, {
		type: 'String' | 'Number' | 'Binary';
		value?: string;
	}>;
	/** Filter policy for subscription filtering */
	filterPolicy?: Record<string, string | string[]>;
	/** Dead letter queue configuration */
	deadLetterQueue?: {
		targetArn: string;
		maxReceiveCount: number;
	};
}

/**
 * AWS SQS binding configuration  
 */
export type AwsSqsBindingConfig = {
	/** Queue name or URL */
	queue: string;
	/** AWS region */
	region?: string;
	/** Message group ID for FIFO queues */
	messageGroupId?: string;
	/** Message deduplication ID */
	messageDeduplicationId?: string;
	/** Visibility timeout in seconds */
	visibilityTimeoutSeconds?: number;
	/** Dead letter queue configuration */
	deadLetterQueue?: {
		targetArn: string;
		maxReceiveCount: number;
	};
}

/**
 * Google Cloud Pub/Sub binding configuration
 */
export type GcpPubsubBindingConfig = {
	/** Topic name */
	topic: string;
	/** Project ID */
	projectId?: string;
	/** Subscription name for subscribers */
	subscription?: string;
	/** Message ordering key */
	orderingKey?: string;
	/** Message attributes */
	attributes?: Record<string, string>;
	/** Dead letter policy */
	deadLetterPolicy?: {
		deadLetterTopic: string;
		maxDeliveryAttempts: number;
	};
	/** Retry policy */
	retryPolicy?: {
		minimumBackoff: string;
		maximumBackoff: string;
	};
}

/**
 * Kafka binding configuration (enhanced)
 */
export type KafkaBindingConfig = {
	/** Topic name */
	topic: string;
	/** Partition key */
	key?: string;
	/** Number of partitions */
	partitions?: number;
	/** Replication factor */
	replicas?: number;
	/** Cleanup policy */
	cleanup?: 'delete' | 'compact' | 'compact,delete';
	/** Retention time in milliseconds */
	retentionMs?: number;
	/** Consumer group ID */
	groupId?: string;
	/** Schema registry configuration */
	schemaRegistry?: {
		url: string;
		subjectName: string;
		version?: string | 'latest';
	};
}

/**
 * Union type for all binding configurations
 */
export type CloudBindingConfig = 
	| AwsSnsBindingConfig
	| AwsSqsBindingConfig  
	| GcpPubsubBindingConfig
	| KafkaBindingConfig
	| Record<string, unknown> // For other binding types

/**
 * Complete binding configuration with metadata
 */
export type CloudBinding = {
	/** Binding type identifier */
	bindingType: CloudBindingType;
	/** Type-specific configuration */
	config: CloudBindingConfig;
	/** Binding metadata */
	metadata?: {
		/** Environment (dev, staging, prod) */
		environment?: string;
		/** Region or availability zone */
		region?: string;
		/** Version of binding specification */
		version?: string;
		/** Additional tags for organization */
		tags?: string[];
	};
}

/**
 * @bindings decorator for cloud provider specific configurations
 *
 * Applies protocol and cloud provider specific binding configurations to
 * operations and models, enabling deployment to various message brokers
 * and cloud services with their native features.
 *
 * @example AWS SNS binding:
 * ```typespec
 * @bindings("aws-sns", #{
 *   topic: "arn:aws:sns:us-east-1:123456789012:UserEvents",
 *   region: "us-east-1",
 *   attributes: #{
 *     eventType: #{ type: "String", value: "user.registered" }
 *   }
 * })
 * @channel("/user-events")
 * @publish
 * op publishUserEvent(): UserEvent;
 * ```
 *
 * @example Google Pub/Sub binding:
 * ```typespec
 * @bindings("gcp-pubsub", #{
 *   topic: "user-notifications",
 *   projectId: "my-gcp-project",
 *   orderingKey: "userId",
 *   attributes: #{ source: "user-service" }
 * })
 * @channel("/notifications")
 * @subscribe  
 * op subscribeUserNotifications(): NotificationEvent;
 * ```
 */
export function $bindings(
	context: DecoratorContext,
	target: Operation | Model,
	bindingType: string,
	config: Record<string, unknown>,
): void {
	Effect.log(`🔗 PROCESSING @bindings decorator on ${target.kind}: ${target.name}`)
	Effect.log(`🔗 Binding type: ${bindingType}`)
	Effect.log(`🔗 Config:`, config)

	// Validate binding type
	if (!isValidBindingType(bindingType)) {
		Effect.log(`❌ Unsupported binding type: ${bindingType}`)
		Effect.log(`✅ Supported types: ${getSupportedBindingTypes().join(', ')}`)
		return
	}

	// Validate and normalize configuration
	const validatedConfig = validateBindingConfig(bindingType as CloudBindingType, config)
	if (!validatedConfig) {
		Effect.log(`❌ Invalid binding configuration for ${bindingType}`)
		return
	}

	// Create complete binding configuration
	const binding: CloudBinding = {
		bindingType: bindingType as CloudBindingType,
		config: validatedConfig,
		metadata: extractMetadata(config)
	}

	// Store binding in program state
	const bindingsMap = context.program.stateMap($lib.stateKeys.cloudBindings)
	
	// Get existing bindings for this target or create new array
	const existingBindings = (bindingsMap.get(target) as CloudBinding[]) || []
	existingBindings.push(binding)
	
	bindingsMap.set(target, existingBindings)

	Effect.log(`✅ Successfully stored ${bindingType} binding for ${target.name}`)
	Effect.log(`🔗 Total bindings for target: ${existingBindings.length}`)
}

/**
 * Get cloud bindings for a target
 */
export function getCloudBindings(
	context: DecoratorContext,
	target: Operation | Model,
): CloudBinding[] {
	const bindingsMap = context.program.stateMap($lib.stateKeys.cloudBindings)
	return (bindingsMap.get(target) as CloudBinding[]) || []
}

/**
 * Get cloud bindings of a specific type
 */
export function getCloudBindingsByType(
	context: DecoratorContext,
	target: Operation | Model,
	bindingType: CloudBindingType,
): CloudBinding[] {
	const bindings = getCloudBindings(context, target)
	return bindings.filter(binding => binding.bindingType === bindingType)
}

/**
 * Check if target has cloud bindings
 */
export function hasCloudBindings(
	context: DecoratorContext,
	target: Operation | Model,
): boolean {
	const bindings = getCloudBindings(context, target)
	return bindings.length > 0
}

/**
 * Validate binding type against supported types
 */
function isValidBindingType(bindingType: string): boolean {
	return getSupportedBindingTypes().includes(bindingType as CloudBindingType)
}

/**
 * Get all supported binding types
 */
function getSupportedBindingTypes(): CloudBindingType[] {
	return [
		'kafka',
		'amqp', 
		'websocket',
		'aws-sns',
		'aws-sqs',
		'gcp-pubsub',
		'azure-servicebus',
		'redis',
		'pulsar'
	]
}

/**
 * Validate and normalize binding configuration based on type
 */
function validateBindingConfig(
	bindingType: CloudBindingType,
	config: Record<string, unknown>,
): CloudBindingConfig | null {
	switch (bindingType) {
		case 'aws-sns':
			return validateAwsSnsConfig(config)
		case 'aws-sqs':
			return validateAwsSqsConfig(config)
		case 'gcp-pubsub':
			return validateGcpPubsubConfig(config)
		case 'kafka':
			return validateKafkaConfig(config)
		default:
			// For other binding types, return as-is with basic validation
			return config.topic || config.queue || config.channel ? config : null
	}
}

/**
 * Validate AWS SNS configuration
 */
function validateAwsSnsConfig(config: Record<string, unknown>): AwsSnsBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ AWS SNS binding requires topic field`)
		return null
	}

	const snsConfig: AwsSnsBindingConfig = {
		topic: config.topic as string,
		region: config.region as string | undefined,
	}

	// Validate attributes
	if (config.attributes && typeof config.attributes === 'object') {
		snsConfig.attributes = config.attributes as Record<string, { type: 'String' | 'Number' | 'Binary', value?: string }>
	}

	// Validate filter policy
	if (config.filterPolicy && typeof config.filterPolicy === 'object') {
		snsConfig.filterPolicy = config.filterPolicy as Record<string, string | string[]>
	}

	// Validate dead letter queue
	if (config.deadLetterQueue && typeof config.deadLetterQueue === 'object') {
		const dlq = config.deadLetterQueue as Record<string, unknown>
		if (dlq.targetArn && dlq.maxReceiveCount) {
			snsConfig.deadLetterQueue = {
				targetArn: dlq.targetArn as string,
				maxReceiveCount: dlq.maxReceiveCount as number
			}
		}
	}

	return snsConfig
}

/**
 * Validate AWS SQS configuration
 */
function validateAwsSqsConfig(config: Record<string, unknown>): AwsSqsBindingConfig | null {
	if (!config.queue || typeof config.queue !== 'string') {
		Effect.log(`❌ AWS SQS binding requires queue field`)
		return null
	}

	return {
		queue: config.queue as string,
		region: config.region as string | undefined,
		messageGroupId: config.messageGroupId as string | undefined,
		messageDeduplicationId: config.messageDeduplicationId as string | undefined,
		visibilityTimeoutSeconds: config.visibilityTimeoutSeconds as number | undefined,
	}
}

/**
 * Validate Google Pub/Sub configuration
 */
function validateGcpPubsubConfig(config: Record<string, unknown>): GcpPubsubBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ Google Pub/Sub binding requires topic field`)
		return null
	}

	return {
		topic: config.topic as string,
		projectId: config.projectId as string | undefined,
		subscription: config.subscription as string | undefined,
		orderingKey: config.orderingKey as string | undefined,
		attributes: config.attributes as Record<string, string> | undefined,
	}
}

/**
 * Validate Kafka configuration (enhanced)
 */
function validateKafkaConfig(config: Record<string, unknown>): KafkaBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ Kafka binding requires topic field`)
		return null
	}

	return {
		topic: config.topic as string,
		key: config.key as string | undefined,
		partitions: config.partitions as number | undefined,
		replicas: config.replicas as number | undefined,
		cleanup: config.cleanup as 'delete' | 'compact' | 'compact,delete' | undefined,
		retentionMs: config.retentionMs as number | undefined,
		groupId: config.groupId as string | undefined,
	}
}

/**
 * Extract metadata from configuration
 */
function extractMetadata(config: Record<string, unknown>): CloudBinding['metadata'] {
	return {
		environment: config.environment as string | undefined,
		region: config.region as string | undefined,
		version: config.version as string | undefined,
		tags: config.tags as string[] | undefined,
	}
}