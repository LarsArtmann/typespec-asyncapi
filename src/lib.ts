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
// TODO: CRITICAL - Group imports by category with separating comments for maintainability
// TODO: TYPE_SAFETY - Import specific types needed: type TypeSpecLibrary from "@typespec/compiler"
// TODO: TYPE_SAFETY - Add explicit return type annotations to imported functions for better IDE support
// TODO: TYPE_SAFETY - Consider importing { type } for createTypeSpecLibrary if only used in type position
// TODO: PERFORMANCE - Verify all imported functions are actually used to avoid dead imports
import {
  createTypeSpecLibrary,
  type DecoratorContext,
  type DiagnosticTarget,
  paramMessage,
} from "@typespec/compiler";

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
// TODO: TYPE_SAFETY - Add explicit TypeSpecLibrary type import and annotation: const $lib: TypeSpecLibrary
// TODO: TYPE_SAFETY - Consider extracting diagnostics object to separate const with explicit type for reusability
// TODO: TYPE_SAFETY - State schema could use more specific types instead of generic description strings
// TODO: ARCHITECTURE - Add version information to library metadata for better debugging and compatibility
// TODO: ARCHITECTURE - Consider organizing diagnostics by category (validation, protocol, security, performance)
// TODO: MAINTENANCE - Extract diagnostic messages to separate localization file for i18n support
// TODO: VALIDATION - Add JSON Schema validation for library definition structure at build time
export const $lib = createTypeSpecLibrary({
  name: "@lars-artmann/typespec-asyncapi",
  // TODO: Add library description, version, and other metadata fields
  diagnostics: {
    // TODO: TYPE_SAFETY - Extract diagnostics to typed const with DiagnosticMap<string, DiagnosticDefinition> for reusability
    // TODO: TYPE_SAFETY - Each diagnostic should have explicit severity type: "error" | "warning" | "info"
    // TODO: TYPE_SAFETY - Add template parameter types for paramMessage template arguments
    // TODO: ARCHITECTURE - Group related diagnostics with separating comments (version, channel, message, protocol, security)
    // TODO: MAINTENANCE - Consider using enum for diagnostic codes to prevent typos and enable refactoring
    // TODO: VALIDATION - Add runtime validation that all referenced template parameters exist in messages

    // === VERSION VALIDATION DIAGNOSTICS ===
    "invalid-asyncapi-version": {
      // TODO: TYPE_SAFETY - severity should use const assertion: "error" as const
      severity: "error",
      // TODO: TYPE_SAFETY - Add multiple message variants for different contexts (CLI, IDE, programmatic)
      // TODO: TYPE_SAFETY - Template parameters should be explicitly typed: version: string
      messages: {
        // Using hardcoded AsyncAPI version instead of constant
        // TODO: TYPE_SAFETY - paramMessage template should specify parameter types
        default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only AsyncAPI 3.0.0 is supported. Update your emitter options to use "3.0.0".`,
      },
    },

    // === CHANNEL VALIDATION DIAGNOSTICS ===
    "missing-channel-path": {
      // TODO: TYPE_SAFETY - severity: "error" as const for better type inference
      severity: "error",
      messages: {
        // TODO: TYPE_SAFETY - Template parameters should be typed: operationName: string
        // TODO: UX - Add actionable examples in the error message for different channel patterns
        // TODO: UX - Add link to documentation about channel path requirements
        // TODO: UX - Include common channel patterns in the error message for immediate help
        default: paramMessage`Operation '${"operationName"}' missing @channel decorator. Add @channel("/your-channel-path") to specify the channel path.`,
      },
    },
    "invalid-channel-path": {
      // TODO: TYPE_SAFETY - severity: "error" as const
      severity: "error",
      messages: {
        // TODO: TYPE_SAFETY - Template parameters should be typed: path: string
        // TODO: UX - Add specific validation rules documentation in the error message
        // TODO: UX - Provide examples of valid channel path formats
        // TODO: UX - Add suggestion for fixing common path format mistakes
        // TODO: UX - Include regex pattern or validation function reference for developers
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
    "test-simple": {
      severity: "error",
      messages: {
        default: "This is a simple test diagnostic without parameters.",
      },
    },
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`Server configuration '${"serverName"}' is not valid. ${"error"} Server configurations must include url and protocol.`,
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
    channelPaths: { description: "Map of operation to channel path" },
    messageSchemas: { description: "Map of message names to their schemas" },
    messageConfigs: { description: "Map of models to message configurations" },
    messageHeaders: {
      description: "Map of model properties marked as headers",
    },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    protocolConfigs: {
      description: "Map of targets to protocol configurations",
    },
    securitySchemes: { description: "Security scheme configurations" },
    securityConfigs: {
      description: "Map of targets to security configurations",
    },
    operationTypes: {
      description: "Map of operations to publish/subscribe type",
    },
    tags: { description: "Map of targets to tag arrays for categorization" },
    correlationIds: {
      description: "Map of models to correlation ID configurations",
    },
    cloudBindings: {
      description: "Map of targets to cloud provider specific bindings",
    },
  },
  // TODO: Add additional library metadata (version, author, repository)
  // NOTE: Decorators are auto-discovered through module exports, not registered in createTypeSpecLibrary
} as const);

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
// TODO: CRITICAL TYPE_SAFETY - Use keyof typeof $lib.state to ensure stateKeys match state schema exactly
// TODO: TYPE_SAFETY - Add explicit type annotation: const stateKeys: StateKeyMap = {...}
// TODO: TYPE_SAFETY - Create StateKeyMap interface to define the expected structure
// TODO: VALIDATION - Add runtime validation to ensure stateKeys match library state definitions at build time
// TODO: ARCHITECTURE - Consider extracting to a separate constants file for better organization and reusability
// TODO: MAINTENANCE - Add unit tests to verify stateKeys sync with $lib.state schema
// TODO: TYPE_SAFETY - Consider using template literal types for better IntelliSense support
// TODO: PERFORMANCE - Evaluate if stateKeys should be frozen with Object.freeze() for immutability
export const stateKeys = {
  // TODO: TYPE_SAFETY - Each key should have explicit type annotation and inline comment
  // TODO: VALIDATION - Add static assertion that these keys exist in $lib.state schema
  channelPaths: "channelPaths", // Maps TypeSpec operations to AsyncAPI channel path strings
  messageSchemas: "messageSchemas", // Maps message names to their TypeSpec model schema definitions
  messageConfigs: "messageConfigs", // Maps TypeSpec models to @message decorator configuration objects
  messageHeaders: "messageHeaders", // Maps model properties marked as headers with @header decorator
  serverConfigs: "serverConfigs", // Stores @server decorator configuration data for AsyncAPI servers
  protocolBindings: "protocolBindings", // Maps protocol names to their binding configuration objects
  protocolConfigs: "protocolConfigs", // Maps TypeSpec targets to @protocol decorator settings
  securitySchemes: "securitySchemes", // Stores security scheme definitions for authentication
  securityConfigs: "securityConfigs", // Maps TypeSpec targets to @security decorator settings
  operationTypes: "operationTypes", // Maps operations to publish/subscribe classifications
  tags: "tags", // Maps targets to tag arrays for categorization and organization
  correlationIds: "correlationIds", // Maps models to correlation ID configurations for message tracking
  cloudBindings: "cloudBindings", // Maps targets to cloud provider specific binding configurations
} as const;

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
 * @param code - Diagnostic code (must be one of the codes defined in $lib.diagnostics)
 * @param args - Optional arguments for error message templating
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
// TODO: CRITICAL TYPE_SAFETY - Add input validation for context, target, and code parameters with proper type guards
// TODO: TYPE_SAFETY - Add explicit return type annotation: ): void for clarity and consistency
// TODO: TYPE_SAFETY - Target parameter should be more specific: target: Node | Type instead of unknown
// TODO: TYPE_SAFETY - Code parameter should use union type of valid diagnostic codes for type safety
// TODO: TYPE_SAFETY - Args parameter should be typed as specific interfaces per diagnostic code
// TODO: ARCHITECTURE - Extract library namespace prefix to a constant to avoid duplication and centralize config
// TODO: FEATURE - Consider adding severity parameter to override default diagnostic severity (error/warning/info)
// TODO: LOGGING - Add structured logging for diagnostic reporting for debugging and monitoring purposes
// TODO: ARCHITECTURE - Consider adding diagnostic categories or tags for better organization and filtering
// TODO: TYPE_SAFETY - Add function overloads for common diagnostic patterns to improve developer experience
// TODO: PERFORMANCE - Consider caching the prefixed diagnostic code for performance in hot paths
// TODO: VALIDATION - Add validation that the diagnostic code exists in the library definition before reporting
export function reportDiagnostic(
  context: DecoratorContext,
  target: DiagnosticTarget,
  code: keyof typeof $lib.diagnostics,
  args?: Record<string, never>,
): void {
  // TODO: TYPE_SAFETY - Add runtime validation that context is valid DecoratorContext
  // TODO: TYPE_SAFETY - Add validation that target is valid TypeSpec AST node
  // TODO: TYPE_SAFETY - Add validation that code is non-empty string and exists in diagnostic definitions
  // TODO: ERROR_HANDLING - Add error handling for reportDiagnostic failures with try-catch
  // TODO: PERFORMANCE - Consider caching the prefixed diagnostic code for performance optimization

  // Use TypeSpec library's diagnostic system which handles template resolution automatically
  // $lib.reportDiagnostic automatically resolves paramMessage templates and creates proper Diagnostic objects
  // The args object is passed as the 'format' property for template parameter resolution
  // Debug: Create diagnostic using library creator first
  const diagnosticInput = {
    code,
    target,
    format: args ?? {},
  };

  // Create diagnostic using library's diagnostic creator
  const resolvedDiagnostic = $lib.createDiagnostic(diagnosticInput);

  // Report directly to program
  context.program.reportDiagnostic(resolvedDiagnostic);
}

/**
 * State Symbols - Unique symbols for TypeSpec state management
 *
 * These symbols provide collision-proof keys for storing decorator data
 * during TypeSpec compilation. Each symbol is scoped to this library.
 */
export const stateSymbols = {
  channelPaths: Symbol("channelPaths"),
  messageSchemas: Symbol("messageSchemas"),
  messageConfigs: Symbol("messageConfigs"),
  messageHeaders: Symbol("messageHeaders"),
  serverConfigs: Symbol("serverConfigs"),
  protocolBindings: Symbol("protocolBindings"),
  protocolConfigs: Symbol("protocolConfigs"),
  securitySchemes: Symbol("securitySchemes"),
  securityConfigs: Symbol("securityConfigs"),
  operationTypes: Symbol("operationTypes"),
  tags: Symbol("tags"),
  correlationIds: Symbol("correlationIds"),
  cloudBindings: Symbol("cloudBindings"),
} as const;

/**
 * NOTE: Decorators do NOT need to be exported from lib.ts
 *
 * TypeSpec auto-discovers decorators through the namespace export in decorators.ts.
 * The critical fix was adding: export const namespace = "TypeSpec.AsyncAPI"
 *
 * Lib.ts is only for library definition, diagnostics, and state management.
 */
