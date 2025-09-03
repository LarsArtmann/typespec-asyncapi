import type {Binding, ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

export type HttpMessageBinding = {
	headers?: SchemaObject | ReferenceObject;
	statusCode?: number;
} & Binding