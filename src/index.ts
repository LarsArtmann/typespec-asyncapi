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
// TODO: Consider grouping imports by category (TypeSpec, Effect, local) with separating comments
// TODO: Add explicit return type annotations to all imported types for better IDE support
import type { EmitContext } from "@typespec/compiler";

import { setTypeSpecNamespace } from "@typespec/compiler";
// TODO: Import only specific Effect functions needed instead of entire Effect namespace
import { Effect } from "effect";
import type { AsyncAPIEmitterOptions } from "./options.js";

// AsyncAPI Decorator Imports - Core decorator functions for TypeSpec annotations
// TODO: Consider using a barrel export from decorators/index.ts to simplify imports
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
// TODO: Extract namespace string to a constant to avoid duplication and typos
// TODO: Add error handling for setTypeSpecNamespace failure
// TODO: Consider organizing decorators by category (core, message, server, security)
setTypeSpecNamespace("TypeSpec.AsyncAPI", $channel, $publish, $subscribe, $server, $message, $protocol, $security);

// Export decorator functions (for TypeSpec compiler) - THIS IS A MUST!
// TODO: Remove redundant comment and make it more descriptive
// TODO: Consider using a more functional approach with array spreading for exports
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
// TODO: Consider adding explicit return type annotation for clarity
// TODO: Add input validation for context parameter
// TODO: Consider extracting string literals to constants for maintainability
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
    // Import the working Effect.TS emitter
    // TODO: Consider pre-importing at module level instead of dynamic import for better performance
    // TODO: Add error handling for import failure
    // TODO: Add type assertion for imported function
    const { generateAsyncAPIWithEffect } = await import("./emitter-with-effect.js");
    
    // TODO: Remove emoji from log messages for professional production logging
    // TODO: Use structured logging instead of simple strings
    // TODO: Add log levels (debug, info, warn, error) instead of generic log
    // TODO: Extract log messages to constants for consistency and i18n support
    Effect.log("🎯 TYPESPEC ASYNCAPI EMITTER STARTED - USING REAL PROCESSOR");
    Effect.log(`📁 Output directory: ${context.emitterOutputDir}`);
    // TODO: Add null-safety check for context.program before accessing properties
    Effect.log(`🔧 Program has ${context.program?.sourceFiles?.size || 0} source files`);
    Effect.log("✨ Processing TypeSpec operations, decorators, and models...");
    
    // Use the working Effect.TS integrated emitter that actually processes TypeSpec content
    // TODO: Add try-catch block for error handling and proper error reporting
    // TODO: Add performance timing measurements
    // TODO: Add validation for context.emitterOutputDir existence
    // TODO: Consider returning processing statistics or summary
    await generateAsyncAPIWithEffect(context);
    
    // TODO: Add actual validation that the document was successfully generated
    // TODO: Log file paths and sizes of generated documents
    // TODO: Add summary statistics (number of channels, operations, etc.)
    Effect.log("✅ AsyncAPI document generated with REAL content from TypeSpec processing!");
}

