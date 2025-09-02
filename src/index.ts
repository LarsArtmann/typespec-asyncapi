/**
 * @fileoverview TypeSpec AsyncAPI Emitter - Production-ready AsyncAPI 3.0 code generator
 * 
 * This module provides the main entry point for the TypeSpec AsyncAPI emitter that generates
 * AsyncAPI 3.0 specifications from TypeSpec definitions. It handles decorator registration,
 * TypeSpec AST processing, and document generation using Effect.TS patterns.
 * 
 * @module @typespec/asyncapi
 * @author TypeSpec Community
 * @version 0.1.0-alpha
 * @since 2025-01-01
 * 
 * @example Basic usage in TypeSpec configuration:
 * ```typescript
 * import "@typespec/asyncapi";
 * 
 * @channel("user-events")
 * @publish
 * op publishUserRegistered(): UserRegisteredMessage;
 * ```
 * 
 * @example Emitter usage in tspconfig.yaml:
 * ```yaml
 * emit:
 *   - "@typespec/asyncapi"
 * options:
 *   "@typespec/asyncapi":
 *     output-format: "yaml"
 * ```
 */

// Core TypeScript imports - TypeSpec compiler integration
// TODO: CRITICAL - Group imports by category (TypeSpec, Effect, local) with separating comments for better maintainability
// TODO: CRITICAL - Add explicit return type annotations to all imported types for better IDE support and type safety
// TODO: CRITICAL - Consider using import maps or path aliases to simplify complex import paths
// TODO: CRITICAL - Add validation for required TypeSpec compiler version compatibility
import type { EmitContext } from "@typespec/compiler";

import { setTypeSpecNamespace } from "@typespec/compiler";
// TODO: CRITICAL - Import only specific Effect functions needed instead of entire Effect namespace for better tree shaking
// TODO: CRITICAL - Effect is imported but only Effect.log is used - consider importing { log } from "effect/Effect" specifically
import { Effect } from "effect";
import type { AsyncAPIEmitterOptions } from "./options.js";

// AsyncAPI Decorator Imports - Core decorator functions for TypeSpec annotations
// TODO: CRITICAL - Consider using a barrel export from decorators/index.ts to simplify imports and reduce coupling
// TODO: CRITICAL - 7 individual decorator imports create high maintenance overhead - use barrel export pattern
// TODO: CRITICAL - Decorator import order should match registration order for consistency
/** @channel decorator - Defines AsyncAPI channel configuration for message routing */
import { $channel } from "./decorators/channel.js";
/** @publish decorator - Marks operations as message publishing (send) operations */
import { $publish } from "./decorators/publish.js";
/** @subscribe decorator - Marks operations as message subscription (receive) operations */
import { $subscribe } from "./decorators/subscribe.js";
/** @server decorator - Defines AsyncAPI server connection configuration */
import { $server } from "./decorators/server.js";
/** @message decorator - Defines AsyncAPI message schema and metadata */
import { $message } from "./decorators/message.js";
/** @protocol decorator - Defines protocol-specific bindings (MQTT, WebSocket, etc.) */
import { $protocol } from "./decorators/protocol.js";
/** @security decorator - Defines authentication and authorization requirements */
import { $security } from "./decorators/security.js";

// TypeSpec Library Integration - Required exports for TypeSpec compiler
/**
 * $lib export - TypeSpec library definition containing decorator metadata and state management
 * 
 * This export provides the TypeSpec compiler with essential library information including:
 * - Decorator definitions and their parameter schemas
 * - State management keys for storing decorator data during compilation
 * - Diagnostic definitions for error reporting
 * - Library metadata (name, version, dependencies)
 * 
 * Required by TypeSpec compiler for proper library integration and decorator processing.
 */
export { $lib } from "./lib.js";
// TODO: Consider re-exporting all types from a single types.ts file for better organization
export type { AsyncAPIEmitterOptions } from "./options.js";

// Register decorators with TypeSpec.AsyncAPI namespace
// TODO: CRITICAL - Extract namespace string to a constant to avoid duplication and typos across codebase
// TODO: CRITICAL - Add error handling for setTypeSpecNamespace failure - what happens if namespace registration fails?
// TODO: CRITICAL - Consider organizing decorators by category (core, message, server, security) for better maintainability
// TODO: CRITICAL - Magic string "TypeSpec.AsyncAPI" should be exported as NAMESPACE_NAME constant
// TODO: CRITICAL - No validation that decorator functions are valid before namespace registration
setTypeSpecNamespace("TypeSpec.AsyncAPI", $channel, $publish, $subscribe, $server, $message, $protocol, $security);

// Export decorator functions (for TypeSpec compiler) - THIS IS A MUST!
// TODO: CRITICAL - Remove redundant comment and make it more descriptive about WHY these exports are required
// TODO: CRITICAL - Consider using a more functional approach with array spreading for exports for maintainability
// TODO: CRITICAL - Export array matches setTypeSpecNamespace arguments but order could diverge - add validation
// TODO: CRITICAL - Missing documentation about which decorators are optional vs required for basic functionality
export { $channel, $publish, $subscribe, $server, $message, $protocol, $security };

/**
 * AsyncAPI Emitter Entry Point - TypeSpec to AsyncAPI 3.0 Document Generator
 * 
 * Main emitter function called by the TypeSpec compiler to generate AsyncAPI 3.0 specifications
 * from TypeSpec definitions. Processes TypeSpec AST including operations, decorators, and models
 * to generate complete AsyncAPI documents with channels, operations, messages, and schemas.
 * 
 * Features:
 * - Full AsyncAPI 3.0 specification compliance
 * - TypeSpec decorator processing (@channel, @publish, @subscribe, @server, etc.)
 * - Effect.TS integration for functional error handling and performance monitoring
 * - Multiple output formats (JSON, YAML)
 * - Comprehensive validation and error reporting
 * 
 * @param context - TypeSpec emit context containing program AST, options, and output configuration
 * @param context.program - TypeSpec program containing compiled AST with all type definitions
 * @param context.emitterOutputDir - Output directory path for generated AsyncAPI files
 * @param context.options - Emitter-specific configuration options (format, validation, etc.)
 * 
 * @returns Promise<void> - Completes when AsyncAPI documents are successfully generated and written to disk
 * 
 * @throws {Error} Import failure when loading emitter implementation
 * @throws {TypeError} Invalid or missing context parameter
 * @throws {Error} File system errors during document generation
 * @throws {ValidationError} AsyncAPI specification validation failures
 * @throws {CompilerError} TypeSpec AST processing errors
 * 
 * @example Basic usage in TypeSpec emitter configuration:
 * ```typescript
 * // tspconfig.yaml
 * emit:
 *   - "@typespec/asyncapi"
 * options:
 *   "@typespec/asyncapi":
 *     output-format: "yaml"
 *     validate: true
 * ```
 * 
 * @example Programmatic usage:
 * ```typescript
 * import { $onEmit } from "@typespec/asyncapi";
 * import { compile } from "@typespec/compiler";
 * 
 * const program = await compile(host, "main.tsp", {
 *   emit: ["@typespec/asyncapi"]
 * });
 * 
 * await $onEmit({
 *   program: program.program,
 *   emitterOutputDir: "./generated",
 *   options: { "output-format": "json" }
 * });
 * ```
 * 
 * @example Generated AsyncAPI document structure:
 * ```yaml
 * asyncapi: 3.0.0
 * info:
 *   title: Generated API
 *   version: 1.0.0
 * channels:
 *   user-events:
 *     address: /users/{userId}/events
 *     messages:
 *       UserRegisteredMessage: ...
 * operations:
 *   publishUserRegistered:
 *     action: send
 *     channel: { $ref: '#/channels/user-events' }
 * ```
 * 
 * @since 0.1.0-alpha
 * @public
 */
// TODO: CRITICAL - Add explicit return type annotation Promise<void> for clarity and better TypeScript errors
// TODO: CRITICAL - Add input validation for context parameter - what happens with null/undefined context?
// TODO: CRITICAL - Consider extracting string literals to constants for maintainability and i18n support
// TODO: CRITICAL - Function is async but uses dynamic import - should handle import failures gracefully
// TODO: CRITICAL - No error boundary for unhandled exceptions from generateAsyncAPIWithEffect
// TODO: CRITICAL - Missing timeout handling for potentially long-running emit operations
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
    // Import the working Effect.TS emitter
    // TODO: CRITICAL - Pre-import at module level instead of dynamic import for better performance and early error detection
    // TODO: CRITICAL - Add error handling for import failure with meaningful error message for users
    // TODO: CRITICAL - Add type assertion for imported function to ensure generateAsyncAPIWithEffect matches expected signature
    // TODO: CRITICAL - Dynamic import creates circular dependency risk - validate import graph
    const { generateAsyncAPIWithEffect } = await import("./emitter-with-effect.js");
    
    // Run the Effect-based emitter with proper error handling
    const emissionEffect = generateAsyncAPIWithEffect(context);
    
    await Effect.runPromise(
        emissionEffect.pipe(
            Effect.catchAll((error) => {
                // Log branded error details for debugging - safely handle unknown error
                const errorMessage = error && typeof error === 'object' && 'message' in error 
                    ? String(error.message) 
                    : String(error);
                const errorTag = error && typeof error === 'object' && '_tag' in error 
                    ? String(error._tag) 
                    : 'Unknown';
                
                Effect.log(`AsyncAPI Emitter Failed: ${errorMessage}`);
                Effect.log(`Error Type: ${errorTag}`);
                if (error && typeof error === 'object' && 'program' in error && error.program) {
                    Effect.log(`Program Details: ${JSON.stringify(error.program, null, 2)}`);
                }
                // Re-throw as standard Error for TypeSpec compiler
                return Effect.fail(new Error(`AsyncAPI Emitter Error [${errorTag}]: ${errorMessage}`));
            }),
            Effect.tap(() => Effect.log("✅ AsyncAPI document generated successfully with proper Effect.TS error handling!"))
        )
    );
}

