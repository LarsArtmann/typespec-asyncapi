/**
 * Official Kafka Protocol Bindings for AsyncAPI using Confluent's Kafka JavaScript Client
 *
 * UPGRADED TO USE OFFICIAL CONFLUENT KAFKA TYPES!
 * 
 * Based on @confluentinc/kafka-javascript v1.4.1 (2024) - Confluent's official
 * JavaScript client for Apache Kafka with native TypeScript support.
 * 
 * This replaces custom type definitions with battle-tested official types
 * from Confluent's librdkafka-based JavaScript client.
 *
 * Features supported:
 * - Topic configuration with official Kafka config types
 * - Partition settings
 * - Consumer group bindings
 * - Schema Registry integration (via @confluentinc/schema-registry)
 * - Advanced security configurations
 * - Transactional support
 * - Compression codecs (GZIP, Snappy, LZ4, ZSTD)
 * - Authentication methods (Plain, SSL, SASL_SSL)
 */

// ✅ DONE: Successfully integrated @confluentinc/kafka-javascript v1.4.1 for official Kafka types!
// No more custom type definitions needed - using battle-tested Confluent types

import {
	validatePositiveInteger,
	validateRequiredString,
	validateStringLength,
	validateStringPattern,
} from "../utils/protocol-validation"
import type { Binding } from "@asyncapi/parser/esm/spec-types/v3"
import type { 
	GlobalConfig,
	ProducerGlobalConfig,
	ConsumerGlobalConfig,
	ConsumerTopicConfig
} from "@confluentinc/kafka-javascript/types/config"
import type { 
	ClientConfig 
} from "@confluentinc/schemaregistry/dist/rest-service"

/**
 * Official Kafka Channel Binding using Confluent's types
 * Combines AsyncAPI Binding interface with Confluent Kafka client configuration
 */
export type KafkaChannelBinding = Binding & {
	/** Kafka topic name */
	topic: string;
	/** Number of partitions (optional, defaults to cluster setting) */
	partitions?: number;
	/** Replication factor (optional, defaults to cluster setting) */
	replicas?: number;
	/** Topic configuration overrides - using official Kafka config keys */
	configs?: Partial<GlobalConfig>;
}

/**
 * Official Kafka Operation Binding using Confluent's consumer configuration
 */
export type KafkaOperationBinding = Binding & {
	/** Consumer group ID for subscribe operations */
	groupId?: string;
	/** Client ID for identification */
	clientId?: string;
	/** Consumer global configuration using official Confluent types */
	consumerConfig?: Partial<ConsumerGlobalConfig>;
	/** Consumer topic configuration using official Confluent types */
	consumerTopicConfig?: Partial<ConsumerTopicConfig>;
	/** Producer configuration using official Confluent types */
	producerConfig?: Partial<ProducerGlobalConfig>;
}

/**
 * Official Kafka Message Binding with Schema Registry support
 */
export type KafkaMessageBinding = Binding & {
	/** Message key configuration */
	key?: {
		type: "string" | "avro" | "json" | "protobuf";
		schema?: string;
		schemaId?: number;
	};
	/** Message headers using Confluent's header format */
	headers?: Record<string, string | Buffer | null>;
	/** Schema ID location for Schema Registry */
	schemaIdLocation?: "payload" | "header";
	/** Official Schema Registry configuration using Confluent types */
	schemaRegistry?: Partial<ClientConfig>;
}

/**
 * Official Kafka Server Binding with full Confluent configuration support
 */
export type KafkaServerBinding = Binding & {
	/** Global Kafka configuration using official Confluent types */
	config?: Partial<GlobalConfig>;
	/** Official Schema Registry configuration using Confluent types */
	schemaRegistry?: Partial<ClientConfig>;
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

	// Validate consumer configuration if provided
	if (binding.consumerConfig?.["auto.commit.interval.ms"] !== undefined) {
		const intervalMs = binding.consumerConfig["auto.commit.interval.ms"];
		const intervalValidation = validatePositiveInteger(intervalMs, "Auto-commit interval", undefined)
		errors.push(...intervalValidation.errors)
		
		if (intervalMs < 100) {
			warnings.push("Very low auto-commit interval may impact performance")
		}
	}

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
 * Create default Kafka operation binding for consumers using official Confluent config
 */
export function createDefaultKafkaOperationBinding(groupId: string): KafkaOperationBinding {
	return {
		groupId,
		clientId: `typespec-asyncapi-${groupId}`,
		consumerConfig: {
			"enable.auto.commit": true,
			"auto.commit.interval.ms": 5000, // 5 seconds - reasonable default
			"session.timeout.ms": 30000
		},
		consumerTopicConfig: {
			"auto.offset.reset": "earliest"
		}
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