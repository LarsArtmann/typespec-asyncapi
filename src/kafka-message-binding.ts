import type {Binding, ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

export type KafkaMessageBinding = {
	key?: SchemaObject | ReferenceObject;
	schemaIdLocation?: "header" | "payload";
	schemaIdPayloadEncoding?: string;
	schemaLookupStrategy?: string;
} & Binding