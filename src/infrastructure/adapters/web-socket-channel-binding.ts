import type {Binding, ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * WebSocket Binding Types (from AsyncAPI WebSocket Binding Specification v0.1.0)
 */
export type WebSocketChannelBinding = {
	method?: "GET" | "POST";
	query?: SchemaObject | ReferenceObject;
	headers?: SchemaObject | ReferenceObject;
} & Binding