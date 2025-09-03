import type {Binding, ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

export type KafkaOperationBinding = {
	groupId?: SchemaObject | ReferenceObject | string;
	clientId?: SchemaObject | ReferenceObject | string;
} & Binding