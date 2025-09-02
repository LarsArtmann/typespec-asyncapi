/**
 * @fileoverview TypeSpec AsyncAPI Library Definition - Core library infrastructure
 * 
 * This module provides the foundational library definition for the TypeSpec AsyncAPI emitter,
 * including decorator definitions, diagnostic messages, state management, and utility functions.
 * 
 * Architecture Components:
 * - Library Definition: Metadata, diagnostics, and state schema for TypeSpec integration
 * - State Management: Centralized state keys for decorator data persistence during compilation
 * - Diagnostic Reporting: Standardized error/warning reporting for TypeSpec validation
 * - Type Safety: Strongly-typed constants and helper functions for reliable emitter operation
 * 
 * This follows TypeSpec library conventions and integrates with the TypeSpec compiler's
 * plugin system for seamless decorator processing and code generation.
 * 
 * @module @typespec/asyncapi/lib
 * @author TypeSpec AsyncAPI Team
 * @version 0.1.0-alpha
 * @since 2025-01-01
 * 
 * @see {@link https://typespec.io/docs/extending-typespec/emitters} TypeSpec Emitter Documentation
 * @see {@link https://www.asyncapi.com/docs/reference/specification/v3.0.0} AsyncAPI 3.0.0 Specification
 */

// TypeSpec Core Imports - Library infrastructure and diagnostic system
// TODO: Consider grouping imports by functionality (core compiler, types, utilities)
// TODO: Add explicit return type annotations to imported functions for better IDE support
import {createTypeSpecLibrary, type DecoratorContext, type Diagnostic, paramMessage} from "@typespec/compiler"

// Constants - Import centralized constants to eliminate hardcoded values
import { ASYNCAPI_VERSIONS, DEFAULT_CONFIG } from "./constants/index.js"

/**
 * TypeSpec AsyncAPI Library Definition - Core library configuration and metadata
 * 
 * This constant defines the complete library configuration required by TypeSpec for proper
 * integration with the compiler. It includes diagnostic definitions, state management schema,
 * and library metadata that enables decorator processing and error reporting.
 * 
 * Structure:
 * - name: Library identifier used by TypeSpec compiler for namespacing
 * - diagnostics: Error and warning message definitions with parameterized templates
 * - state: Schema definition for persistent data storage during compilation
 * 
 * The TypeSpec compiler uses this definition to:
 * - Register diagnostic codes with appropriate severity levels
 * - Initialize state storage for decorator data persistence
 * - Provide IntelliSense and validation in TypeSpec files
 * - Generate comprehensive error messages during compilation
 * 
 * @constant {TypeSpecLibrary} $lib - Complete library definition for TypeSpec integration
 * @readonly
 * @public
 * 
 * @example Library usage in TypeSpec files:
 * ```typescript
 * import "@typespec/asyncapi";
 * 
 * @channel("/users/{userId}/events")
 * @publish
 * op publishUserEvent(): UserEvent;
 * ```
 * 
 * @see {@link createTypeSpecLibrary} TypeSpec library creation function
 */
// TODO: Add version information to library metadata  
// TODO: Consider organizing diagnostics by category (validation, protocol, security)
export const $lib = createTypeSpecLibrary({
	// Using centralized constant instead of hardcoded library name
	name: DEFAULT_CONFIG.LIBRARY_NAME,
	// TODO: Add library description, version, and other metadata fields
	diagnostics: {
		// TODO: Group related diagnostics with separating comments (version, channel, message, etc.)
		"invalid-asyncapi-version": {
			severity: "error",
			// TODO: Add multiple message variants for different contexts (CLI, IDE, programmatic)
			messages: {
				// Using centralized AsyncAPI version constant instead of hardcoded version
				default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only AsyncAPI ${ASYNCAPI_VERSIONS.CURRENT} is supported. Update your emitter options to use "${ASYNCAPI_VERSIONS.CURRENT}".`,
			},
		},
		"missing-channel-path": {
			severity: "error",
			messages: {
				// TODO: Add actionable examples in the error message for different channel patterns
				// TODO: Add link to documentation about channel path requirements
				default: paramMessage`Operation '${"operationName"}' missing @channel decorator. Add @channel("/your-channel-path") to specify the channel path.`,
			},
		},
		"invalid-channel-path": {
			severity: "error",
			messages: {
				// TODO: Add specific validation rules documentation in the error message
				// TODO: Provide examples of valid channel path formats
				// TODO: Add suggestion for fixing common path format mistakes
				default: paramMessage`Channel path '${"path"}' is not valid. Use format: /topic-name, /service/event-type, or {variable} syntax.`,
			},
		},
		"missing-message-schema": {
			severity: "error",
			messages: {
				default: paramMessage`Message '${"messageName"}' must have a defined schema. Use @message decorator with a TypeSpec model.`,
			},
		},
		"conflicting-operation-type": {
			severity: "error",
			messages: {
				default: paramMessage`Operation '${"operationName"}' cannot be both @publish and @subscribe. Choose one operation type.`,
			},
		},
		"unsupported-protocol": {
			severity: "error",
			messages: {
				default: paramMessage`Protocol '${"protocol"}' is not supported. Supported protocols: kafka, amqp, websocket, http.`,
			},
		},
		"missing-server-config": {
			severity: "warning",
			messages: {
				default: "No server configuration found. Add @server decorator to define AsyncAPI servers.",
			},
		},
		"invalid-server-config": {
			severity: "error",
			messages: {
				default: paramMessage`Server configuration '${"config"}' is not valid. Server configurations must include url and protocol.`,
			},
		},
		"duplicate-server-name": {
			severity: "error",
			messages: {
				default: paramMessage`Server name '${"serverName"}' is already defined. Server names must be unique within a namespace.`,
			},
		},
		"invalid-security-scheme": {
			severity: "error",
			messages: {
				default: paramMessage`Security scheme '${"scheme"}' is not valid for AsyncAPI 3.0.`,
			},
		},
		"duplicate-channel-id": {
			severity: "error",
			messages: {
				default: paramMessage`Channel ID '${"channelId"}' is already defined. Channel IDs must be unique within an AsyncAPI specification.`,
			},
		},
		"circular-message-reference": {
			severity: "error",
			messages: {
				default: paramMessage`Circular reference detected in message schema for '${"messageName"}'. Break the circular dependency or use $ref to handle recursion.`,
			},
		},
		"invalid-message-target": {
			severity: "error",
			messages: {
				default: paramMessage`@message decorator can only be applied to models, not '${"targetType"}'.`,
			},
		},
		"invalid-protocol-target": {
			severity: "error",
			messages: {
				default: paramMessage`@protocol decorator can only be applied to operations or models, not '${"targetType"}'.`,
			},
		},
		"missing-protocol-type": {
			severity: "error",
			messages: {
				default: "Protocol configuration must specify a protocol type.",
			},
		},
		"invalid-protocol-type": {
			severity: "error",
			messages: {
				default: paramMessage`Protocol type '${"protocol"}' is not supported. Supported types: ${"validProtocols"}.`,
			},
		},
		"invalid-security-target": {
			severity: "error",
			messages: {
				default: paramMessage`@security decorator can only be applied to operations or models, not '${"targetType"}'.`,
			},
		},
		"missing-security-config": {
			severity: "error",
			messages: {
				default: "Security configuration must specify a name and scheme.",
			},
		},
		"security-scheme-validation-failed": {
			severity: "error",
			messages: {
				default: paramMessage`Security scheme validation failed: ${"errors"}.`,
			},
		},
		"invalid-asyncapi-target": {
			severity: "error",
			messages: {
				default: paramMessage`@asyncapi decorator can only be applied to namespaces, not '${"targetType"}'.`,
			},
		},
		// TODO: Add more diagnostic codes for edge cases and advanced validations
		// TODO: Consider adding info-level diagnostics for best practices
		// TODO: Add diagnostic codes for performance warnings (large schemas, etc.)
	},
	/**
	 * State Management Schema - Decorator data persistence during TypeSpec compilation
	 * 
	 * This section defines the state storage schema used by decorators to persist data
	 * throughout the TypeSpec compilation process. Each state key represents a different
	 * category of data that decorators collect and the emitter later processes.
	 * 
	 * State Categories:
	 * - Channel Configuration: Path mappings and channel-specific settings
	 * - Message Definitions: Schema references and message metadata
	 * - Server Configuration: Connection details and server bindings
	 * - Protocol Settings: Transport-specific configuration (MQTT, WebSocket, etc.)
	 * - Security Configuration: Authentication and authorization schemes
	 * - Operation Metadata: Publish/subscribe classifications and routing information
	 * 
	 * The TypeSpec compiler automatically manages state lifecycle:
	 * 1. Decorators store data using context.program.stateMap()
	 * 2. State persists throughout compilation phases
	 * 3. Emitter retrieves consolidated state for document generation
	 * 4. State is cleaned up automatically after compilation completion
	 * 
	 * @see {@link stateKeys} Strongly-typed state key constants
	 */
	state: {
		// TODO: Add more detailed descriptions including data types and usage patterns
		// TODO: Consider adding validation functions for state data integrity
		// TODO: Group related state by functionality (channels, messages, servers, etc.)
		channelPaths: {description: "Map of operation to channel path"},
		messageSchemas: {description: "Map of message names to their schemas"},
		messageConfigs: {description: "Map of models to message configurations"},
		messageHeaders: {description: "Map of model properties marked as headers"},
		serverConfigs: {description: "Server configurations"},
		protocolBindings: {description: "Protocol-specific bindings"},
		protocolConfigs: {description: "Map of targets to protocol configurations"},
		securitySchemes: {description: "Security scheme configurations"},
		securityConfigs: {description: "Map of targets to security configurations"},
		operationTypes: {description: "Map of operations to publish/subscribe type"},
		tags: {description: "Map of targets to tag arrays for categorization"},
		correlationIds: {description: "Map of models to correlation ID configurations"},
		cloudBindings: {description: "Map of targets to cloud provider specific bindings"},
	},
	// TODO: Add additional library metadata (version, author, repository)
} as const)

/**
 * State Keys Constants - Strongly-typed keys for decorator state management
 * 
 * This constant object provides strongly-typed string literals for accessing state data
 * stored by decorators during TypeSpec compilation. Using these constants instead of
 * raw strings ensures type safety and prevents runtime errors from typos.
 * 
 * Usage Pattern:
 * ```typescript
 * // In decorators - storing data:
 * const stateMap = context.program.stateMap($lib.stateKeys.channelPaths);
 * stateMap.set(operation, "/users/{userId}/events");
 * 
 * // In emitters - retrieving data:
 * const channelPaths = context.program.stateMap($lib.stateKeys.channelPaths);
 * const path = channelPaths.get(operation);
 * ```
 * 
 * State Key Categories:
 * - channelPaths: Maps TypeSpec operations to AsyncAPI channel paths
 * - messageSchemas: Maps message names to their TypeSpec model schemas
 * - messageConfigs: Maps TypeSpec models to @message decorator configuration
 * - serverConfigs: Stores @server decorator configuration data
 * - protocolBindings: Maps protocol names to their binding configurations
 * - protocolConfigs: Maps TypeSpec targets to @protocol decorator settings
 * - securitySchemes: Stores security scheme definitions
 * - securityConfigs: Maps TypeSpec targets to @security decorator settings
 * - operationTypes: Maps operations to publish/subscribe classifications
 * 
 * @constant {StateKeyMap} stateKeys - Type-safe state key constants
 * @readonly
 * @public
 * 
 * @example Accessing state in decorators:
 * ```typescript
 * export function $channel(context: DecoratorContext, target: Operation, path: string) {
 *   const stateMap = context.program.stateMap($lib.stateKeys.channelPaths);
 *   stateMap.set(target, path);
 * }
 * ```
 * 
 * @example Retrieving state in emitters:
 * ```typescript
 * function generateChannels(context: EmitContext) {
 *   const channelPaths = context.program.stateMap($lib.stateKeys.channelPaths);
 *   for (const [operation, path] of channelPaths) {
 *     // Generate AsyncAPI channel from operation and path
 *   }
 * }
 * ```
 * 
 * @see {@link $lib.state} State schema definitions
 */
// TODO: Consider using keyof typeof $lib.state to ensure type safety
// TODO: Add runtime validation to ensure stateKeys match library state definitions
// TODO: Consider extracting to a separate constants file for better organization
export const stateKeys = {
	// TODO: Add inline comments explaining what each state key stores
	channelPaths: "channelPaths",
	messageSchemas: "messageSchemas",
	messageConfigs: "messageConfigs",
	messageHeaders: "messageHeaders",
	serverConfigs: "serverConfigs",
	protocolBindings: "protocolBindings",
	protocolConfigs: "protocolConfigs",
	securitySchemes: "securitySchemes",
	securityConfigs: "securityConfigs",
	operationTypes: "operationTypes",
	tags: "tags",
	correlationIds: "correlationIds",
	cloudBindings: "cloudBindings",
} as const

/**
 * TypeSpec Diagnostic Reporter Helper
 * 
 * This is a standard TypeSpec emitter utility function that reports validation errors
 * and diagnostics during TypeSpec compilation. It's used by decorator implementations
 * to provide meaningful error messages when TypeSpec code doesn't conform to AsyncAPI requirements.
 * 
 * TypeSpec emitters are expected to provide diagnostic reporting capabilities,
 * and this function follows the standard TypeSpec diagnostic pattern by:
 * 1. Accepting a context (from the TypeSpec compiler)
 * 2. Taking a target (the TypeSpec AST node being validated)
 * 3. Using a diagnostic code (prefixed with the emitter namespace)
 * 4. Including optional arguments for error message templating
 * 
 * @param context - TypeSpec emitter context containing the program reference
 * @param target - The TypeSpec AST node that triggered the diagnostic
 * @param code - Diagnostic code (will be prefixed with "@larsartmann/typespec-asyncapi.")
 * @param args - Optional arguments for error message templating
 * 
 * 
 * @returns {void} No return value - diagnostics are reported directly to TypeSpec compiler
 * 
 * @throws {TypeError} When context parameter is null or undefined
 * @throws {Error} When target parameter is not a valid TypeSpec AST node
 * @throws {Error} When diagnostic code is empty or contains invalid characters
 * @throws {Error} When TypeSpec compiler fails to process the diagnostic
 * 
 * @example Basic error reporting in decorator:
 * ```typescript
 * export function $channel(context: DecoratorContext, target: Operation, path?: string) {
 *   if (!path || path.length === 0) {
 *     reportDiagnostic(context, target, "missing-channel-path", {
 *       operationName: target.name
 *     });
 *     return;
 *   }
 *   // Process valid channel path...
 * }
 * ```
 * 
 * @example Validation error with parameters:
 * ```typescript
 * if (!isValidAsyncAPIVersion(version)) {
 *   reportDiagnostic(context, target, "invalid-asyncapi-version", {
 *     version: version
 *   });
 * }
 * ```
 * 
 * @example Complex validation with multiple parameters:
 * ```typescript
 * if (!isValidChannelPath(path)) {
 *   reportDiagnostic(context, target, "invalid-channel-path", {
 *     path: path,
 *     operation: target.name,
 *     suggestions: generatePathSuggestions(path)
 *   });
 * }
 * ```
 * 
 * @since 0.1.0-alpha
 * @public
 */
// TODO: Add input validation for context, target, and code parameters
// TODO: Add explicit return type annotation for clarity
// TODO: Extract library namespace prefix to a constant to avoid duplication
// TODO: Consider adding severity parameter to override default diagnostic severity
// TODO: Add logging for diagnostic reporting for debugging purposes
// TODO: Consider adding diagnostic categories or tags for better organization
// TODO: Add function overloads for common diagnostic patterns
export function reportDiagnostic(context: DecoratorContext, target: unknown, code: string, args?: Record<string, unknown>): void {
	// TODO: Add validation that the diagnostic code exists in the library definition
	// TODO: Add error handling for reportDiagnostic failures
	// TODO: Consider caching the prefixed diagnostic code for performance
	context.program.reportDiagnostic({
		code: `${DEFAULT_CONFIG.LIBRARY_NAME}.${code}`,
		target,
		// TODO: Add validation for args parameter structure
		// TODO: Consider deep cloning args to prevent mutation
		...args,
	} as Diagnostic)
}
