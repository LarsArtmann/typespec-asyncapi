// TODO: Add file-level JSDoc comment describing the module purpose
// TODO: Consider grouping imports by category (TypeSpec, Effect, local) with separating comments
// TODO: Add explicit return type annotations to all imported types for better IDE support
import type { EmitContext } from "@typespec/compiler";

import { setTypeSpecNamespace } from "@typespec/compiler";
// TODO: Import only specific Effect functions needed instead of entire Effect namespace
import { Effect } from "effect";
import type { AsyncAPIEmitterOptions } from "./options.js";

// Import decorators
// TODO: Consider using a barrel export from decorators/index.ts to simplify imports
// TODO: Add JSDoc comments for each decorator import explaining their purpose
import { $channel } from "./decorators/channel.js";
import { $publish } from "./decorators/publish.js";
import { $subscribe } from "./decorators/subscribe.js";
import { $server } from "./decorators/server.js";
import { $message } from "./decorators/message.js";
import { $protocol } from "./decorators/protocol.js";
import { $security } from "./decorators/security.js";

// Export for TypeSpec library
// TODO: Add JSDoc comment explaining what $lib exports and why it's needed
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
 * WORKING AsyncAPI emitter entry point with ACTUAL TypeSpec processing
 * This version processes TypeSpec operations, decorators, and models to generate populated AsyncAPI documents
 * 
 * TODO: Add @param JSDoc for context parameter with full type description
 * TODO: Add @returns JSDoc explaining what this function accomplishes
 * TODO: Add @throws JSDoc for potential error conditions
 * TODO: Add @example JSDoc showing typical usage
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

