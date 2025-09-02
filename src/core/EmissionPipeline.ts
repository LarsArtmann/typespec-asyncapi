/**
 * EmissionPipeline - Sequential Stage Processing
 *
 * Handles the ordered execution of emission stages with plugin integration.
 * Each stage is isolated and can be extended through plugins.
 *
 * Pipeline Stages:
 * 1. Discovery - Find operations, messages, security configs
 * 2. Processing - Transform TypeSpec AST to AsyncAPI structures
 * 3. Generation - Create final AsyncAPI document
 * 4. Validation - Verify AsyncAPI compliance
 * 5. Serialization - Convert to JSON/YAML format
 */

import {Effect} from "effect"
import type {Model, Operation, Program} from "@typespec/compiler"
import type {AssetEmitter} from "@typespec/asset-emitter"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import type {SecurityConfig} from "../decorators/security.js"
import {$lib} from "../lib.js"
import {buildServersFromNamespaces, getMessageConfig} from "../utils/typespec-helpers.js"

export type PipelineContext = {
	program: Program
	asyncApiDoc: AsyncAPIObject
	//TODO: No fucking any!
	emitter: AssetEmitter<string, any>
}

export type DiscoveryResult = {
	operations: Operation[]
	messageModels: Model[]
	securityConfigs: SecurityConfig[]
}

/**
 * Effect.TS-based emission pipeline with plugin integration
 */
export class EmissionPipeline {

	/**
	 * Execute the complete emission pipeline
	 */
	executePipeline(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🚀 Starting emission pipeline stages...`)

			// Stage 1: Discovery
			const discoveryResult = yield* this.executeDiscoveryStage(context)

			// Stage 2: Processing
			yield* this.executeProcessingStage(context, discoveryResult)

			// Stage 3: Document Generation (updates context.asyncApiDoc in-place)
			yield* this.executeGenerationStage(context, discoveryResult)

			// Stage 4: Validation
			yield* this.executeValidationStage(context)

			Effect.log(`✅ All emission pipeline stages completed successfully`)
		}.bind(this))
	}

	/**
	 * Stage 1: Discovery - Find all TypeSpec elements to process
	 */
	private executeDiscoveryStage(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🔍 Stage 1: Discovery`)

			const operations = yield* this.discoverOperations(context.program)
			const messageModels = yield* this.discoverMessageModels(context.program)
			const securityConfigs = yield* this.discoverSecurityConfigs(context.program)

			const result: DiscoveryResult = {
				operations,
				messageModels,
				securityConfigs,
			}

			Effect.log(`📊 Discovery complete: ${operations.length} operations, ${messageModels.length} messages, ${securityConfigs.length} security configs`)

			return result
		}.bind(this))
	}

	/**
	 * Stage 2: Processing - Transform TypeSpec elements
	 */
	private executeProcessingStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🏗️ Stage 2: Processing ${discoveryResult.operations.length} operations...`)

			// Process each operation to build AsyncAPI structures
			for (const operation of discoveryResult.operations) {
				yield* this.processOperation(context, operation)
			}

			// Process message models
			for (const messageModel of discoveryResult.messageModels) {
				yield* this.processMessageModel(context, messageModel)
			}

			// Process security configurations
			for (const securityConfig of discoveryResult.securityConfigs) {
				yield* this.processSecurityConfig(context, securityConfig)
			}

			Effect.log(`✅ Processing stage completed`)
		}.bind(this))
	}

	/**
	 * Stage 3: Document Generation - Finalize AsyncAPI document
	 */
	private executeGenerationStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`📄 Stage 3: Document Generation`)

			// Update document info with discovered statistics
			context.asyncApiDoc.info.description = `Generated from TypeSpec with ${discoveryResult.operations.length} operations`

			// Ensure servers are populated
			if (!context.asyncApiDoc.servers || Object.keys(context.asyncApiDoc.servers).length === 0) {
				context.asyncApiDoc.servers = buildServersFromNamespaces(context.program) as AsyncAPIObject["servers"]
			}

			// CRITICAL FIX: Process discovered operations into AsyncAPI channels and operations
			for (const operation of discoveryResult.operations) {
				yield* this.processOperationIntoDocument(context, operation)
			}

			// Process discovered message models into AsyncAPI components/messages
			for (const model of discoveryResult.messageModels) {
				yield* this.processMessageModelIntoDocument(context, model)
			}

			Effect.log(`✅ Document generation completed - processed ${discoveryResult.operations.length} operations and ${discoveryResult.messageModels.length} messages`)
		}.bind(this))
	}

	/**
	 * Stage 4: Validation - Verify AsyncAPI compliance
	 */
	private executeValidationStage(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🔍 Stage 4: Validation`)

			// Basic structural validation
			const channelsCount = Object.keys(context.asyncApiDoc.channels || {}).length
			const operationsCount = Object.keys(context.asyncApiDoc.operations || {}).length

			if (channelsCount === 0 && operationsCount === 0) {
				yield* Effect.logWarning("⚠️ Document has no channels or operations")
			}

			Effect.log(`✅ Validation completed - ${channelsCount} channels, ${operationsCount} operations`)
		}.bind(this))
	}

	/**
	 * Discover all operations in the TypeSpec program
	 */
	private discoverOperations(program: Program) {
		return Effect.sync(() => {
			const operations: Operation[] = []

			//TODO: No fucking any!
			const walkNamespace = (ns: any) => {
				if (ns.operations) {
					ns.operations.forEach((op: Operation, name: string) => {
						operations.push(op)
						Effect.log(`🔍 Found operation: ${name}`)
					})
				}

				if (ns.namespaces) {
					ns.namespaces.forEach((childNs: any) => {
						walkNamespace(childNs)
					})
				}
			}

			// Safe access to global namespace
			if (typeof program.getGlobalNamespaceType === 'function') {
				walkNamespace(program.getGlobalNamespaceType())
			}

			return operations
		})
	}

	/**
	 * Discover message models with @message decorators
	 */
	private discoverMessageModels(program: Program) {
		return Effect.sync(() => {
			const messageModels: Model[] = []
			const messageConfigsMap = $lib.stateKeys ? program.stateMap($lib.stateKeys.messageConfigs) : null
			const foundModelNames = new Set<string>()

			//TODO: No fucking any!
			const walkNamespaceForModels = (ns: any) => {
				if (ns.models) {
					ns.models.forEach((model: Model, name: string) => {
						// Include all models for now - refine later to only operation return types
						const hasMessageDecorator = messageConfigsMap?.has(model)
						const isUsefulModel = true // For now, include all models
						
						if (hasMessageDecorator || isUsefulModel) {
							if (!foundModelNames.has(name)) {
								messageModels.push(model)
								foundModelNames.add(name)
								Effect.log(`🎯 Found message model: ${name} (decorator: ${!!hasMessageDecorator})`)
							}
						}
					})
				}

				if (ns.namespaces) {
					ns.namespaces.forEach((childNs: any) => {
						walkNamespaceForModels(childNs)
					})
				}
			}

			if (typeof program.getGlobalNamespaceType === 'function') {
				walkNamespaceForModels(program.getGlobalNamespaceType())
			}

			return messageModels
		})
	}

	/**
	 * Discover security configurations
	 */
	private discoverSecurityConfigs(program: Program) {
		return Effect.sync(() => {
			const securityConfigs: SecurityConfig[] = []
			const securityConfigsMap = program.stateMap($lib.stateKeys.securityConfigs)

			//TODO: No fucking any!
			const walkNamespaceForSecurity = (ns: any) => {
				if (ns.operations) {
					ns.operations.forEach((operation: Operation, name: string) => {
						if (securityConfigsMap.has(operation)) {
							const config = securityConfigsMap.get(operation) as SecurityConfig
							securityConfigs.push(config)
							Effect.log(`🔐 Found security config on operation: ${name}`)
						}
					})
				}

				if (ns.models) {
					ns.models.forEach((model: Model, name: string) => {
						if (securityConfigsMap.has(model)) {
							const config = securityConfigsMap.get(model) as SecurityConfig
							securityConfigs.push(config)
							Effect.log(`🔐 Found security config on model: ${name}`)
						}
					})
				}

				if (ns.namespaces) {
					ns.namespaces.forEach((childNs: any) => {
						walkNamespaceForSecurity(childNs)
					})
				}
			}

			if (typeof program.getGlobalNamespaceType === 'function') {
				walkNamespaceForSecurity(program.getGlobalNamespaceType())
			}

			return securityConfigs
		})
	}

	//TODO: NO FUCKING any!!!
	/**
	 * Type-safe helper to get string values from TypeSpec state maps
	 */
	private getStringFromStateMap(stateMap: Map<any, unknown>, key: any): string | undefined {
		const value = stateMap.get(key)
		return typeof value === 'string' ? value : undefined
	}

	/**
	 * Process a single operation and add to AsyncAPI document
	 */
	private processOperation(context: PipelineContext, operation: Operation) {
		return Effect.sync(() => {
			const {program, asyncApiDoc} = context
			const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
			const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)

			const operationType = this.getStringFromStateMap(operationTypesMap, operation)
			const decoratedChannelPath = this.getStringFromStateMap(channelPathsMap, operation)
			const channelPath = decoratedChannelPath ?? `/${operation.name.toLowerCase()}`

			Effect.log(`🔍 Processing operation ${operation.name}: type=${operationType ?? 'none'}, channel=${channelPath}`)

			const channelName = `channel_${operation.name}`
			const action = operationType === "subscribe" ? "receive" : "send"

			// Add channel
			if (!asyncApiDoc.channels) asyncApiDoc.channels = {}
			asyncApiDoc.channels[channelName] = {
				address: channelPath,
				description: `Channel for ${operation.name}`,
				messages: {
					[`${operation.name}Message`]: {
						$ref: `#/components/messages/${operation.name}Message`,
					},
				},
			}

			// Add operation
			if (!asyncApiDoc.operations) asyncApiDoc.operations = {}
			asyncApiDoc.operations[operation.name] = {
				action: action,
				channel: {$ref: `#/channels/${channelName}`},
				summary: `Operation ${operation.name}`,
				description: `TypeSpec operation with ${operation.parameters.properties.size} parameters`,
			}

			// Add message
			if (!asyncApiDoc.components) asyncApiDoc.components = {}
			if (!asyncApiDoc.components.messages) asyncApiDoc.components.messages = {}
			asyncApiDoc.components.messages[`${operation.name}Message`] = {
				name: `${operation.name}Message`,
				title: `${operation.name} Message`,
				summary: `Message for ${operation.name} operation`,
				contentType: "application/json",
			}

			Effect.log(`✅ Processed operation: ${operation.name} (${action})`)
		})
	}

	/**
	 * Process a message model
	 */
	private processMessageModel(context: PipelineContext, model: Model) {
		return Effect.sync(() => {
			const {program, asyncApiDoc} = context
			const messageConfig = getMessageConfig(program, model)

			if (!messageConfig) {
				Effect.log(`⚠️ No message config found for model: ${model.name}`)
				return
			}

			Effect.log(`🎯 Processing message model: ${model.name}`)

			// Ensure components.messages exists
			if (!asyncApiDoc.components?.messages) {
				if (!asyncApiDoc.components) asyncApiDoc.components = {}
				asyncApiDoc.components.messages = {}
			}

			const messageId = messageConfig.name ?? model.name

			// Add message to components.messages
			asyncApiDoc.components.messages[messageId] = {
				name: messageId,
				title: messageConfig.title ?? messageId,
				summary: messageConfig.summary,
				description: messageConfig.description,
				contentType: messageConfig.contentType ?? "application/json",
				examples: messageConfig.examples,
				headers: messageConfig.headers ? {$ref: messageConfig.headers} : undefined,
				correlationId: messageConfig.correlationId ? {$ref: messageConfig.correlationId} : undefined,
				bindings: messageConfig.bindings,
				payload: {
					$ref: `#/components/schemas/${model.name}`,
				},
			}

			Effect.log(`✅ Added message: ${messageId}`)
		})
	}

	/**
	 * Process a security configuration
	 */
	private processSecurityConfig(context: PipelineContext, config: SecurityConfig) {
		return Effect.sync(() => {
			const {asyncApiDoc} = context

			Effect.log(`🔐 Processing security config: ${config.name}`)

			// Ensure components.securitySchemes exists
			if (!asyncApiDoc.components?.securitySchemes) {
				if (!asyncApiDoc.components) asyncApiDoc.components = {}
				asyncApiDoc.components.securitySchemes = {}
			}

			// Convert security config to AsyncAPI security scheme
			// This is a simplified implementation - the full conversion logic
			// should be extracted to a separate security plugin
			asyncApiDoc.components.securitySchemes[config.name] = {
				type: "apiKey", // Simplified for now
				description: config.scheme.description,
			}

			Effect.log(`✅ Added security scheme: ${config.name}`)
		})
	}

	/**
	 * Process a TypeSpec operation into AsyncAPI channels and operations
	 */
	private processOperationIntoDocument(context: PipelineContext, operation: Operation) {
		return Effect.sync(() => {
			const operationName = operation.name || "UnnamedOperation"
			
			// Get decorator state from program state maps (correct TypeSpec pattern)
			const channelPathsMap = context.program.stateMap($lib.stateKeys.channelPaths)
			const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
			
			// Get channel path from @channel decorator state
			const channelPath = this.getStringFromStateMap(channelPathsMap, operation)
			const channelName = channelPath || `channel_${operationName}`
			
			// Get operation type from @publish/@subscribe decorator state  
			const operationType = this.getStringFromStateMap(operationTypesMap, operation)
			const action = operationType === 'publish' ? 'send' : operationType === 'subscribe' ? 'receive' : 'send'
			
			Effect.log(`🔄 Processing operation: ${operationName} -> channel: ${channelName}, action: ${action}`)
			
			// Create channel if it doesn't exist
			if (!context.asyncApiDoc.channels) {
				context.asyncApiDoc.channels = {}
			}
			if (!context.asyncApiDoc.channels[channelName]) {
				context.asyncApiDoc.channels[channelName] = {
					address: channelName,
					messages: {}
				}
			}
			
			// Create operation if it doesn't exist
			if (!context.asyncApiDoc.operations) {
				context.asyncApiDoc.operations = {}
			}
			context.asyncApiDoc.operations[operationName] = {
				action,
				channel: {
					$ref: `#/channels/${channelName}`
				},
				description: `Generated from TypeSpec operation ${operationName}`
			}
		})
	}

	/**
	 * Process a TypeSpec message model into AsyncAPI components/messages
	 */
	private processMessageModelIntoDocument(context: PipelineContext, model: Model) {
		return Effect.sync(() => {
			const modelName = model.name || "UnnamedMessage"
			
			// Get message configuration from state if available
			const messageConfigsMap = context.program.stateMap($lib.stateKeys.messageConfigs)
			const messageConfig = messageConfigsMap.get(model)
			
			Effect.log(`📨 Processing message model: ${modelName}`)
			
			// Ensure components structure exists
			if (!context.asyncApiDoc.components) {
				context.asyncApiDoc.components = {}
			}
			if (!context.asyncApiDoc.components.messages) {
				context.asyncApiDoc.components.messages = {}
			}
			if (!context.asyncApiDoc.components.schemas) {
				context.asyncApiDoc.components.schemas = {}
			}
			
			// Add message to components (use decorator config if available)
			context.asyncApiDoc.components.messages[modelName] = {
				name: messageConfig?.name || modelName,
				title: messageConfig?.title || modelName,
				description: messageConfig?.description || `Generated from TypeSpec model ${modelName}`,
				payload: {
					$ref: `#/components/schemas/${modelName}`
				}
			}
			
			// Add schema to components (simplified for now)
			context.asyncApiDoc.components.schemas[modelName] = {
				type: "object",
				properties: {},
				description: `Schema for ${modelName}`
			}
		})
	}
}