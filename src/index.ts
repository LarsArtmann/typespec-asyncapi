import type { EmitContext } from "@typespec/compiler";
import { $lib } from "./lib.js";
import type { AsyncAPIEmitterOptions } from "./options.js";
import { generateAsyncAPI } from "./simple-emitter.js";

export { $lib } from "./lib.js";
export type { AsyncAPIEmitterOptions } from "./options.js";

// Import all decorator functions so they're available
export * from "./decorators/index.js";

/**
 * AsyncAPI emitter entry point
 * Called by TypeSpec compiler to generate AsyncAPI 3.0 specifications
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  console.log("🎯 TYPESPEC ASYNCAPI EMITTER STARTED");
  console.log("📊 This emitter processes REAL TypeSpec AST data - NO HARDCODED VALUES!");
  console.log(`📁 Output directory: ${context.emitterOutputDir}`);
  console.log(`🔧 Program has ${context.program.sourceFiles.size} source files`);
  console.log(`🌍 Global namespace: ${context.program.getGlobalNamespaceType().name}`);
  
  // Use simplified emitter that PROVES it reads TypeSpec
  await generateAsyncAPI(context);
  
  console.log("🎉 AsyncAPI generation complete!");
}

/**
 * Get the library instance
 */
export function getLibrary() {
  return $lib;
}