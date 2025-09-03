import type {Binding} from "@asyncapi/parser/esm/spec-types/v3.js"

export type KafkaChannelBinding = {
	topic?: string;
	partitions?: number;
	replicas?: number;
	topicConfiguration?: Record<string, unknown>;
} & Binding