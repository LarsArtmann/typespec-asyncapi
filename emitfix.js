import { readFileSync, writeFileSync } from "fs";

// Read current emitter
const emitterCode = readFileSync("src/application/services/emitter.ts", "utf8");

// Replace Effect.tryPromise with direct emitFile call
const fixedCode = emitterCode.replace(
  `yield* Effect.tryPromise({
			try: () => emitFile(context.program, {
				path: fileName,  // Simple path - no directory resolution
				content: content,
			}),
			catch: (error) => createError({
				what: "Failed to emit AsyncAPI file using TypeSpec API",
				reassure: "This is an emit API error, but alternative approaches exist",
				why: "The TypeSpec emitFile function failed",
				fix: "Check file paths and content format",
				escape: "Use direct file write approach",
				severity: "error",
				code: "EMIT_FILE_ERROR",
				context: { outputFile: `${String(outputFile)}.${extension}`, error }
			})
		});`,
  `// 🔥 CRITICAL FIX: Direct emitFile call for test framework compatibility
		yield* Effect.logInfo(`🔍 Emitting file: ${fileName}`)
		
		// Direct emitFile call without Effect wrapper for test framework compatibility
		await emitFile(context.program, {
			path: fileName,
			content: content,
		});
		
		yield* Effect.logInfo(`✅ File emitted: ${fileName}`)`
);

// Write fixed emitter
writeFileSync("src/application/services/emitter.ts", fixedCode);

console.log("✅ Emitter fixed - direct emitFile call for test framework compatibility");
