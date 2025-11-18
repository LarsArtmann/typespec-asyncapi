// Create new direct async function
const newFunction = `export async function generateAsyncAPIWithEffect(context: EmitContext): Promise<void> {
	console.log("🚀 TypeSpec API Integration: Using emitFile for test framework compatibility");
	
	// 🔧 FIX: Register protocol plugins to eliminate warnings
	await registerBuiltInPlugins();
	
	// 🔍 STAGE 1: Discovery (Working - finds operations)
	console.log("🚀 Stage 1: Discovery");
	const discoveryService = new DiscoveryService();
	const discoveryResult = await discoveryService.executeDiscovery(context.program);
	console.log(`✅ Discovery: ${discoveryResult.operations.length} operations found`);
	
	// Create initial AsyncAPI document for processing
	const documentBuilder = new DocumentBuilder();
	const initialDoc = await documentBuilder.createInitialDocument(context.program);
	
	// 🏗️ STAGE 2: Processing (Working - creates channels/operations)
	console.log("🚀 Stage 2: Processing");
	const processingResult = await orchestrateAsyncAPITransformation(
		discoveryResult.operations,
		discoveryResult.messageModels,
		discoveryResult.securityConfigs,
		initialDoc,
		context.program
	);
	console.log(`✅ Processing: ${processingResult.totalProcessed} elements processed`);
	
	// 🔍 STAGE 3: Validation (Working - validates document)
	console.log("🚀 Stage 3: Validation");
	const validationService = new ValidationService();
	const validationResult = await validationService.validateDocument(initialDoc);
	console.log(`✅ Validation: ${validationResult._tag === "Success" ? 'PASSED' : 'FAILED'}`);
	
	// 📄 STAGE 4: TYPESPEC EMITFILE API (Test Framework Integration)
	console.log("🚀 Stage 4: TypeSpec emitFile API");
	
	// Import YAML for serialization
	const yaml = await import("yaml");
	
	// Simple configuration
	const outputFile = context.options["output-file"] || "asyncapi";
	const fileType = (context.options["file-type"] as string) ?? "yaml";
	const extension = fileType === "json" ? "json" : "yaml";
	
	// Simple serialization using processed document
	const content = fileType === "json" 
		? JSON.stringify(initialDoc, null, 2)
		: yaml.stringify(initialDoc);
	
	// 🔥 CRITICAL FIX: Direct emitFile call for test framework compatibility
	const fileName = `${String(outputFile)}.${extension}`;
	console.log(`🔍 Emitting file: ${fileName}`);
	
	// Direct emitFile call without Effect wrapper for test framework compatibility
	await emitFile(context.program, {
		path: fileName,
		content: content,
	});
	
	console.log(`✅ File emitted: ${fileName}`);
	
	// 🎉 ISSUE #180 RESOLUTION SUCCESS
	const channelsCount = Object.keys(initialDoc.channels ?? {}).length;
	const operationsCount = Object.keys(initialDoc.operations ?? {}).length;
	
	console.log(`🎉 TYPESPEC API SUCCESS: ${channelsCount} channels, ${operationsCount} operations`);
	console.log(`🔗 Test framework bridge: Automatic via emitFile API`);
}
`;

console.log(newFunction);
