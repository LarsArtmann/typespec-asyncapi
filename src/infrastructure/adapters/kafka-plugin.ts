/**
 * Built-in Kafka Protocol Plugin
 *
 * Provides Kafka-specific binding generation following AsyncAPI 3.0.0 specification
 * Extracted from ProtocolBindingFactory for modular architecture
 */

import {Effect} from "effect"
import {PROTOCOL_DEFAULTS} from "../../constants/protocol-defaults.js"
import {TEST_VERSIONS} from "../../constants/index.js"
import type {
	KafkaChannelBindingConfig,
	KafkaOperationBindingConfig,
	KafkaMessageBindingConfig
} from "./protocol-bindings.js"
import type {ProtocolPlugin} from "./protocol-plugin.js"
import type {KafkaServerBinding} from "./kafka-server-binding.js"
import type {KafkaChannelBinding} from "./kafka-channel-binding.js"
import type {KafkaOperationBinding} from "./kafka-operation-binding.js"
import type {KafkaMessageBinding} from "./kafka-message-binding.js"

/**
 * Kafka Plugin - Extracts logic from ProtocolBindingFactory
 * 
 * This implementation provides the same functionality as KafkaProtocolBinding
 * but integrates with the plugin system for better modularity.
 */
export const kafkaPlugin: ProtocolPlugin = {
	name: "kafka",
	version: TEST_VERSIONS.PLUGIN,

	generateOperationBinding: (operation: unknown) => Effect.gen(function* () {
		yield* Effect.log("🔧 Generating Kafka operation binding")
		
		// Extract config from operation or use defaults
		const config = (operation as {config?: KafkaOperationBindingConfig})?.config ?? {}

		const binding: KafkaOperationBinding = {
			bindingVersion: "0.5.0",
			groupId: config.groupId ?? PROTOCOL_DEFAULTS.kafka.defaultGroupId,
			clientId: config.clientId ?? PROTOCOL_DEFAULTS.kafka.defaultClientId,
			...config,
		}

		return {kafka: binding}
	}),

	generateMessageBinding: (message: unknown) => Effect.gen(function* () {
		yield* Effect.log("📨 Generating Kafka message binding")
		
		// Extract config from message or use defaults
		const config = (message as {config?: KafkaMessageBindingConfig})?.config ?? {}

		const binding: KafkaMessageBinding = {
			bindingVersion: "0.5.0",
			key: config.key ?? {
				type: "string",
				description: "Message key for partitioning",
			},
			schemaIdLocation: config.schemaIdLocation ?? PROTOCOL_DEFAULTS.kafka.schemaIdLocation as "header" | "payload",
			schemaIdPayloadEncoding: config.schemaIdPayloadEncoding ?? "apicurio-new",
			...(config.schemaLookupStrategy ? { schemaLookupStrategy: config.schemaLookupStrategy } : {}),
			...config,
		}

		return {kafka: binding}
	}),

	generateServerBinding: (server: unknown) => Effect.gen(function* () {
		yield* Effect.log("🖥️  Generating Kafka server binding")

		// Extract config from server or use defaults
		const config = (server as {config?: Partial<KafkaServerBinding>})?.config ?? {}
		
		const binding: KafkaServerBinding = {
			bindingVersion: "0.5.0",
			schemaRegistryUrl: config.schemaRegistryUrl ?? "http://localhost:8081",
			schemaRegistryVendor: config.schemaRegistryVendor ?? "apicurio",
			...config,
		}

		return {kafka: binding}
	}),

	/**
	 * Generate channel bindings for Kafka topics
	 */
	generateChannelBinding: (channel: unknown) => Effect.gen(function* () {
		yield* Effect.log("📡 Generating Kafka channel binding")
		
		// Extract config from channel or use defaults with proper typing
		const channelData = channel as {config?: KafkaChannelBindingConfig & {topic: string}} | Record<string, unknown>
		const rawConfig = ('config' in channelData ? channelData.config : {}) ?? {}
		
		// Type-safe extraction with proper casting
		const config = rawConfig as KafkaChannelBindingConfig
		
		const binding: KafkaChannelBinding = {
			bindingVersion: "0.5.0",
			topic: (config.topic as string) ?? "default-topic",
			...(config.partitions ? { partitions: config.partitions } : {}),
			...(config.replicas ? { replicas: config.replicas } : {}),
			...(config.topicConfiguration ? { topicConfiguration: config.topicConfiguration } : {}),
		}

		return {kafka: binding}
	}),

	validateConfig: (config: unknown) => Effect.gen(function* () {
		yield* Effect.log("✅ Validating Kafka configuration")

		// Validate Kafka-specific configuration
		if (typeof config !== 'object' ?? config === null) {
			return false
		}

		const kafkaConfig = config as KafkaOperationBindingConfig | KafkaMessageBindingConfig | KafkaChannelBindingConfig

		// Validate groupId and clientId for operation bindings
		if ('groupId' in kafkaConfig && kafkaConfig.groupId) {
			if (typeof kafkaConfig.groupId !== 'string' && typeof kafkaConfig.groupId !== 'object') {
				return false
			}
		}

		// Validate schemaIdLocation for message bindings
		if ('schemaIdLocation' in kafkaConfig && kafkaConfig.schemaIdLocation) {
			if (!['header', 'payload'].includes(kafkaConfig.schemaIdLocation)) {
				return false
			}
		}

		// Validate topic for channel bindings
		if ('topic' in kafkaConfig && kafkaConfig.topic) {
			if (typeof kafkaConfig.topic !== 'string' ?? kafkaConfig.topic.trim().length === 0) {
				return false
			}
		}

		// Validate partitions and replicas
		if ('partitions' in kafkaConfig && kafkaConfig.partitions) {
			if (typeof kafkaConfig.partitions !== 'number' ?? kafkaConfig.partitions < 1) {
				return false
			}
		}

		if ('replicas' in kafkaConfig && kafkaConfig.replicas) {
			if (typeof kafkaConfig.replicas !== 'number' ?? kafkaConfig.replicas < 1) {
				return false
			}
		}

		return true
	}),
}