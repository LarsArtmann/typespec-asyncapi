/**
 * Shared protocol binding utility patterns
 * Eliminates code duplication in protocol binding configurations
 */

import type {ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Common HTTP method types - eliminates duplication
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";

/**
 * Common HTTP operation binding configuration
 * Eliminates duplication between HttpOperationBindingParams and HttpOperationBindingConfig
 */
export type BaseHttpOperationBinding = {
	type?: "request" | "response";
	method?: HttpMethod;
	query?: SchemaObject | ReferenceObject;
	statusCode?: number;
};

/**
 * Common HTTP message binding configuration
 * Eliminates duplication between HttpMessageBindingParams and HttpMessageBindingConfig
 */
export type BaseHttpMessageBinding = {
	headers?: SchemaObject | ReferenceObject;
	statusCode?: number;
};

/**
 * Common WebSocket channel binding configuration
 * Consolidates WebSocket binding patterns
 */
export type BaseWebSocketChannelBinding = {
	method?: "GET" | "POST";
	query?: SchemaObject | ReferenceObject;
	headers?: SchemaObject | ReferenceObject;
};

/**
 * Protocol binding validation utilities
 * Eliminates duplication in validation patterns
 */
export const protocolBindingHelpers = {
	/**
	 * Validate HTTP method
	 */
	isValidHttpMethod: (method: string): method is HttpMethod => {
		const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"];
		return validMethods.includes(method as HttpMethod);
	},

	/**
	 * Validate WebSocket method
	 */
	isValidWebSocketMethod: (method: string): method is "GET" | "POST" => {
		return method === "GET" || method === "POST";
	},

	/**
	 * Create default HTTP operation binding
	 */
	createDefaultHttpOperationBinding: (): BaseHttpOperationBinding => ({
		type: "request",
		method: "POST",
	}),

	/**
	 * Create default HTTP message binding
	 */
	createDefaultHttpMessageBinding: (): BaseHttpMessageBinding => ({
		statusCode: 200,
	}),

	/**
	 * Create default WebSocket channel binding
	 */
	createDefaultWebSocketChannelBinding: (): BaseWebSocketChannelBinding => ({
		method: "GET",
	}),
};
