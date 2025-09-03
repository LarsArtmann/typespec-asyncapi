import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"
import type {CloudBindingType} from "../constants/cloud-binding-type.js"
import {getSupportedBindingTypes} from "../constants/cloud-binding-type.js"
import type {AwsSnsBindingConfig} from "./aws-sns-binding-config.js"
import type {GoogleCloudPubSubBindingConfig} from "./google-cloud-pub-sub-binding-config.js"
import type {KafkaBindingConfig} from "./kafka-binding-config.js"
import type {CloudBindingConfig} from "./cloud-binding-config.js"
import type {CloudBinding} from "./cloud-binding.js"
import type {AwsSqsBindingConfig} from "./aws-sqs-binding-config.js"

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
	const validatedConfig = validateBindingConfig(bindingType, config)
	if (!validatedConfig) {
		Effect.log(`❌ Invalid binding configuration for ${bindingType}`)
		return
	}

	// Create complete binding configuration
	const extractedMetadata = extractMetadata(config)
	const binding: CloudBinding = {
		bindingType: bindingType,
		config: validatedConfig,
		// Use conditional spread to avoid exactOptionalPropertyTypes violations
		...(extractedMetadata && Object.keys(extractedMetadata).length > 0 ? { metadata: extractedMetadata } : {}),
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
function isValidBindingType(bindingType: string): bindingType is CloudBindingType {
	return bindingType in getSupportedBindingTypes()
}


/**
 * Validate and normalize binding configuration based on type
 * TODO: Use Effect.TS!
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
 * TODO: Use Effect.TS!
 */
function validateAwsSnsConfig(config: Record<string, unknown>): AwsSnsBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ AWS SNS binding requires topic field`)
		return null
	}

	const snsConfig: AwsSnsBindingConfig = {
		topic: config.topic,
		...(config.region ? { region: config.region as string } : {}),
	}

	// Validate attributes
	if (config.attributes && typeof config.attributes === 'object') {
		snsConfig.attributes = config.attributes as Record<string, {
			type: 'String' | 'Number' | 'Binary',
			value?: string
		}>
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
				maxReceiveCount: dlq.maxReceiveCount as number,
			}
		}
	}

	return snsConfig
}

/**
 * Validate AWS SQS configuration
 * TODO: Use Effect.TS!
 */
function validateAwsSqsConfig(config: Record<string, unknown>): AwsSqsBindingConfig | null {
	if (!config.queue || typeof config.queue !== 'string') {
		Effect.log(`❌ AWS SQS binding requires queue field`)
		return null
	}

	return {
		queue: config.queue,
		...(config.region ? { region: config.region as string } : {}),
		...(config.messageGroupId ? { messageGroupId: config.messageGroupId as string } : {}),
		...(config.messageDeduplicationId ? { messageDeduplicationId: config.messageDeduplicationId as string } : {}),
		...(config.visibilityTimeoutSeconds ? { visibilityTimeoutSeconds: config.visibilityTimeoutSeconds as number } : {}),
	}
}

/**
 * Validate Google Pub/Sub configuration
 * TODO: Use Effect.TS!
 */
function validateGcpPubsubConfig(config: Record<string, unknown>): GoogleCloudPubSubBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ Google Pub/Sub binding requires topic field`)
		return null
	}

	return {
		topic: config.topic,
		...(config.projectId ? { projectId: config.projectId as string } : {}),
		...(config.subscription ? { subscription: config.subscription as string } : {}),
		...(config.orderingKey ? { orderingKey: config.orderingKey as string } : {}),
		...(config.attributes ? { attributes: config.attributes as Record<string, string> } : {}),
	}
}

/**
 * Validate Kafka configuration (enhanced)
 * TODO: Use Effect.TS!
 */
function validateKafkaConfig(config: Record<string, unknown>): KafkaBindingConfig | null {
	if (!config.topic || typeof config.topic !== 'string') {
		Effect.log(`❌ Kafka binding requires topic field`)
		return null
	}

	return {
		topic: config.topic,
		...(config.key ? { key: config.key as string } : {}),
		...(config.partitions ? { partitions: config.partitions as number } : {}),
		...(config.replicas ? { replicas: config.replicas as number } : {}),
		...(config.cleanup ? { cleanup: config.cleanup as 'delete' | 'compact' | 'compact,delete' } : {}),
		...(config.retentionMs ? { retentionMs: config.retentionMs as number } : {}),
		...(config.groupId ? { groupId: config.groupId as string } : {}),
	}
}

/**
 * Extract metadata from configuration
 * TODO: improve!
 */
function extractMetadata(config: Record<string, unknown>): CloudBinding['metadata'] {
	return {
		...(config.environment ? { environment: config.environment as string } : {}),
		...(config.region ? { region: config.region as string } : {}),
		...(config.version ? { version: config.version as string } : {}),
		...(config.tags ? { tags: config.tags as string[] } : {}),
	}
}