import { readFileSync, writeFileSync } from "fs";

// Read current emitter
const emitterCode = readFileSync("src/application/services/emitter.ts", "utf8");

// Define the patterns to replace
const effectPattern = /yield\* Effect\.tryPromise\(\{[\s\S]*?\}\);/s;
const directCall = `// 🔥 CRITICAL FIX: Direct emitFile call for test framework compatibility
		yield* Effect.logInfo(`🔍 Emitting file: ${fileName}`)
		
		// Direct emitFile call without Effect wrapper for test framework compatibility
		await emitFile(context.program, {
			path: fileName,
			content: content,
		});
		
		yield* Effect.logInfo(`✅ File emitted: ${fileName}`)`;

// Replace Effect.tryPromise with direct emitFile call
const fixedCode = emitterCode.replace(effectPattern, directCall);

// Write fixed emitter
writeFileSync("src/application/services/emitter.ts", fixedCode);

console.log("✅ Emitter fixed - direct emitFile call for test framework compatibility");
