import type { EmitContext } from "@typespec/compiler";
import { setTypeSpecNamespace } from "@typespec/compiler";
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
 * Minimal AsyncAPI emitter entry point
 * This version only exports decorators without the full Effect.TS integration
 * to test if the decorator implementation pattern is correct.
 */
// noinspection JSUnusedGlobalSymbols - TypeSpec compiler
// eslint-disable-next-line @typescript-eslint/require-await
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
    console.log("🎯 MINIMAL TYPESPEC ASYNCAPI EMITTER STARTED");
    console.log(`📁 Output directory: ${context.emitterOutputDir}`);
    console.log(`🔧 Program has ${context.program.sourceFiles.size || 0} source files`);
    
    // Simple test: just log that we're running
    console.log("✅ Minimal AsyncAPI emitter completed (no actual AsyncAPI generation)");
}

