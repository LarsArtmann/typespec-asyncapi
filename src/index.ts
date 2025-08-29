import type { EmitContext, Program } from "@typespec/compiler";
import { $lib } from "./lib.js";
import AsyncAPIEmitterOptionsSchema, { type AsyncAPIEmitterOptions } from "./options.js";

export { $lib } from "./lib.js";
export { AsyncAPIEmitterOptions } from "./options.js";

// Register the emitter options schema with the library
$lib.emitter = {
  options: AsyncAPIEmitterOptionsSchema,
};

/**
 * AsyncAPI emitter entry point
 * Called by TypeSpec compiler to generate AsyncAPI 3.0 specifications
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  // TODO: Implement AsyncAPIEmitter class and generation logic
  // This is a placeholder implementation for initial setup
  
  const outputDir = context.emitterOutputDir;
  const options = {
    "output-file": "asyncapi",
    "file-type": "yaml" as const,
    "asyncapi-version": "3.0.0" as const,
    "omit-unreachable-types": false,
    "include-source-info": false,
    "validate-spec": true,
    ...context.options,
  };

  console.log(`AsyncAPI Emitter: Generating ${options["file-type"]} output to ${outputDir}/${options["output-file"]}.${options["file-type"]}`);
  console.log("Options:", options);
  
  // For now, just log that the emitter was called
  // Full implementation will be added in subsequent phases
}

/**
 * Get the library instance
 */
export function getLibrary() {
  return $lib;
}