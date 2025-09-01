// TODO: Add file-level JSDoc comment describing this module's purpose and architecture
// TODO: Consider grouping imports by functionality (core compiler, types, utilities)
// TODO: Add explicit return type annotations to imported functions for better IDE support
import {createTypeSpecLibrary, type DecoratorContext, type Diagnostic, paramMessage} from "@typespec/compiler"

// TODO: Add JSDoc comment explaining the purpose and structure of $lib export
// TODO: Extract library name to a constant to avoid duplication
// TODO: Add version information to library metadata  
// TODO: Consider organizing diagnostics by category (validation, protocol, security)
export const $lib = createTypeSpecLibrary({
	name: "@larsartmann/typespec-asyncapi",
	// TODO: Add library description, version, and other metadata fields
	diagnostics: {
		// TODO: Group related diagnostics with separating comments (version, channel, message, etc.)
		"invalid-asyncapi-version": {
			severity: "error",
			// TODO: Add multiple message variants for different contexts (CLI, IDE, programmatic)
			messages: {
				// TODO: Extract supported versions to a constant for maintainability
				default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only AsyncAPI 3.0.0 is supported. Update your emitter options to use "3.0.0".`,
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
		// TODO: Add more diagnostic codes for edge cases and advanced validations
		// TODO: Consider adding info-level diagnostics for best practices
		// TODO: Add diagnostic codes for performance warnings (large schemas, etc.)
	},
	// TODO: Add JSDoc comment explaining state management architecture
	state: {
		// TODO: Add more detailed descriptions including data types and usage patterns
		// TODO: Consider adding validation functions for state data integrity
		// TODO: Group related state by functionality (channels, messages, servers, etc.)
		channelPaths: {description: "Map of operation to channel path"},
		messageSchemas: {description: "Map of message names to their schemas"},
		messageConfigs: {description: "Map of models to message configurations"},
		serverConfigs: {description: "Server configurations"},
		protocolBindings: {description: "Protocol-specific bindings"},
		protocolConfigs: {description: "Map of targets to protocol configurations"},
		securitySchemes: {description: "Security scheme configurations"},
		securityConfigs: {description: "Map of targets to security configurations"},
		operationTypes: {description: "Map of operations to publish/subscribe type"},
	},
	// TODO: Add additional library metadata (version, author, repository)
} as const)

// Export state keys for use in decorators and emitters
// TODO: Add JSDoc comment explaining the purpose and usage of stateKeys
// TODO: Consider using keyof typeof $lib.state to ensure type safety
// TODO: Add runtime validation to ensure stateKeys match library state definitions
// TODO: Consider extracting to a separate constants file for better organization
export const stateKeys = {
	// TODO: Add inline comments explaining what each state key stores
	channelPaths: "channelPaths",
	messageSchemas: "messageSchemas",
	messageConfigs: "messageConfigs",
	serverConfigs: "serverConfigs",
	protocolBindings: "protocolBindings",
	protocolConfigs: "protocolConfigs",
	securitySchemes: "securitySchemes",
	securityConfigs: "securityConfigs",
	operationTypes: "operationTypes",
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
 * TODO: Add @returns JSDoc explaining the return value (void)
 * TODO: Add @throws JSDoc for potential error conditions
 * TODO: Add @example JSDoc showing typical usage in decorators
 * TODO: Add @since version annotation
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
		code: `@larsartmann/typespec-asyncapi.${code}`,
		target,
		// TODO: Add validation for args parameter structure
		// TODO: Consider deep cloning args to prevent mutation
		...args,
	} as Diagnostic)
}
