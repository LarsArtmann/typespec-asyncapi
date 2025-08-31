import type { EmitContext } from "@typespec/compiler";
import { setTypeSpecNamespace } from "@typespec/compiler";
import { Effect } from "effect";
import type { AsyncAPIEmitterOptions } from "./options.js";

// Import decorators
import { $channel } from "./decorators/channel.js";
import { $publish } from "./decorators/publish.js";
import { $subscribe } from "./decorators/subscribe.js";
import { $server } from "./decorators/server.js";
import { $message } from "./decorators/message.js";
import { $protocol } from "./decorators/protocol.js";
import { $security } from "./decorators/security.js";

// Export for TypeSpec library
export { $lib } from "./lib.js";
export type { AsyncAPIEmitterOptions } from "./options.js";

// Register decorators with TypeSpec.AsyncAPI namespace
setTypeSpecNamespace("TypeSpec.AsyncAPI", $channel, $publish, $subscribe, $server, $message, $protocol, $security);

// Export decorator functions (for TypeSpec compiler) - THIS IS A MUST!
export { $channel, $publish, $subscribe, $server, $message, $protocol, $security };

/**
 * WORKING AsyncAPI emitter entry point with ACTUAL TypeSpec processing
 * This version processes TypeSpec operations, decorators, and models to generate populated AsyncAPI documents
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
    // Import the working Effect.TS emitter
    const { generateAsyncAPIWithEffect } = await import("./emitter-with-effect.js");
    
    Effect.log("🎯 TYPESPEC ASYNCAPI EMITTER STARTED - USING REAL PROCESSOR");
    Effect.log(`📁 Output directory: ${context.emitterOutputDir}`);
    Effect.log(`🔧 Program has ${context.program.sourceFiles.size || 0} source files`);
    Effect.log("✨ Processing TypeSpec operations, decorators, and models...");
    
    // Use the working Effect.TS integrated emitter that actually processes TypeSpec content
    await generateAsyncAPIWithEffect(context);
    
    Effect.log("✅ AsyncAPI document generated with REAL content from TypeSpec processing!");
}

