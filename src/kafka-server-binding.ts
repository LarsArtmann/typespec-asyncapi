/**
 * OFFICIAL ASYNCAPI v3 KAFKA BINDING TYPES
 * Based on AsyncAPI Kafka Binding Specification v0.5.0
 */
import type {Binding} from "@asyncapi/parser/esm/spec-types/v3.js"

export type KafkaServerBinding = {
	schemaRegistryUrl?: string;
	schemaRegistryVendor?: string;
} & Binding