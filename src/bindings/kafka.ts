/**
 * Essential Kafka Protocol Bindings for AsyncAPI
 *
 * Implements core Kafka features only:
 * - Topic configuration
 * - Partition settings
 * - Consumer group bindings
 *
 * LIMITATIONS: Advanced Kafka features not yet supported
 * - Schema Registry integration
 * - Complex serialization options
 * - Advanced security configurations
 * - Custom partitioners
 * - Exactly-once semantics
 */

//TODO: Is there no Kafka TypeScript Types library we can use??

import {
	validatePositiveInteger,
	validateRequiredString,
	validateStringLength,
	validateStringPattern,
} from "../utils/protocol-validation"

export type KafkaChannelBinding = {
	/** Kafka topic name */
	topic: string;
	/** Number of partitions (optional, defaults to cluster setting) */
	partitions?: number;
	/** Replication factor (optional, defaults to cluster setting) */
	replicas?: number;
	/** Topic configuration overrides */
	configs?: Record<string, string>;
}

export type KafkaOperationBinding = {
	/** Consumer group ID for subscribe operations */
	groupId?: string;
	/** Client ID for identification */
	clientId?: string;
	/** Whether to auto-commit offsets */
	autoCommit?: boolean;
	/** Auto-commit interval in milliseconds */
	autoCommitIntervalMs?: number;
}

export type KafkaMessageBinding = {
	/** Message key (for partitioning) */
	key?: {
		type: "string" | "avro" | "json";
		schema?: string;
	};
	/** Message headers */
	headers?: Record<string, {
		type: "string" | "integer" | "bytes";
		description?: string;
	}>;
	/** Schema ID for schema registry (if using) */
	schemaIdLocation?: "payload" | "header";
}

export type KafkaServerBinding = {
	/** Schema registry URL (if using) */
	schemaRegistryUrl?: string;
	/** Schema registry vendor */
	schemaRegistryVendor?: "confluent" | "apicurio";
}

/**
 * Essential Kafka binding types for AsyncAPI generation
 */
export type KafkaBindings = {
	channel?: KafkaChannelBinding;
	operation?: KafkaOperationBinding;
	message?: KafkaMessageBinding;
	server?: KafkaServerBinding;
};

/**
 * Validate essential Kafka channel binding
 */
export function validateKafkaChannelBinding(binding: KafkaChannelBinding): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = []
	const warnings: string[] = []

	// Validate topic name using shared utilities
	errors.push(...validateRequiredString(binding.topic, "Topic name"))

	if (binding.topic) {
		errors.push(...validateStringPattern(
			binding.topic,
			"Topic name",
			/^[a-zA-Z0-9._-]+$/,
			"contains invalid characters. Use only letters, numbers, dots, underscores, and hyphens",
		))
		errors.push(...validateStringLength(binding.topic, "Topic name", 249))
	}

	// Validate partitions with shared utilities
	const partitionValidation = validatePositiveInteger(binding.partitions, "Partitions", 1000)
	errors.push(...partitionValidation.errors)
	warnings.push(...partitionValidation.warnings)

	// Validate replicas with shared utilities
	const replicaValidation = validatePositiveInteger(binding.replicas, "Replicas", 10)
	errors.push(...replicaValidation.errors)
	warnings.push(...replicaValidation.warnings)

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * Validate essential Kafka operation binding
 */
export function validateKafkaOperationBinding(binding: KafkaOperationBinding): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = []
	const warnings: string[] = []

	// Validate group ID using shared utilities
	if (binding.groupId !== undefined) {
		errors.push(...validateRequiredString(binding.groupId, "Group ID"))
		errors.push(...validateStringPattern(
			binding.groupId,
			"Group ID",
			/^[a-zA-Z0-9._-]+$/,
			"contains invalid characters",
		))
	}

	// Validate client ID using shared utilities
	if (binding.clientId !== undefined) {
		errors.push(...validateRequiredString(binding.clientId, "Client ID"))
		errors.push(...validateStringLength(binding.clientId, "Client ID", 255))
	}

	// Validate auto-commit interval using shared utilities
	const intervalValidation = validatePositiveInteger(binding.autoCommitIntervalMs, "Auto-commit interval", undefined)
	if (binding.autoCommitIntervalMs !== undefined && binding.autoCommitIntervalMs < 100) {
		warnings.push("Very low auto-commit interval may impact performance")
	}
	errors.push(...intervalValidation.errors)

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * Create default Kafka channel binding
 */
export function createDefaultKafkaChannelBinding(topicName: string): KafkaChannelBinding {
	return {
		topic: topicName,
		// Use cluster defaults for partitions and replicas
		// Most production clusters have sensible defaults
	}
}

/**
 * Create default Kafka operation binding for consumers
 */
export function createDefaultKafkaOperationBinding(groupId: string): KafkaOperationBinding {
	return {
		groupId,
		autoCommit: true,
		autoCommitIntervalMs: 5000, // 5 seconds - reasonable default
	}
}

/**
 * Utility functions for working with Kafka bindings
 */
export const KAFKA_BINDING_UTILS = {
	/**
	 * Check if a topic name is valid
	 */
	isValidTopicName(topic: string): boolean {
		return topic.length > 0 &&
			topic.length <= 249 &&
			/^[a-zA-Z0-9._-]+$/.test(topic)
	},

	/**
	 * Sanitize topic name by replacing invalid characters
	 */
	sanitizeTopicName(topic: string): string {
		return topic
			.replace(/[^a-zA-Z0-9._-]/g, '_')
			.substring(0, 249)
	},

	/**
	 * Generate a default group ID from operation name
	 */
	generateGroupId(operationName: string, namespace?: string): string {
		const base = namespace ? `${namespace}_${operationName}` : operationName
		return this.sanitizeTopicName(`${base}_consumer_group`)
	},
}