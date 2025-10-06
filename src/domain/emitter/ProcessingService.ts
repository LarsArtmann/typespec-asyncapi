/**
 * ProcessingService - TypeSpec to AsyncAPI Transformation Engine
 * 
 * Extracted from 1,800-line monolithic emitter to handle transformation of discovered
 * TypeSpec elements (operations, message models, security configs) into AsyncAPI structures.
 * 
 * REAL BUSINESS LOGIC EXTRACTED from lines 693-1217 of AsyncAPIEffectEmitter class
 * This is the transformation engine that makes TypeSpec definitions become AsyncAPI documents
 */

import { Effect } from "effect"
import type { Model, Operation, Program } from "@typespec/compiler"
import type { AsyncAPIObject, SecuritySchemeObject, OperationObject, MessageObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { $lib } from "../../lib.js"
import { generateProtocolBinding, type AsyncAPIProtocolType } from "../../infrastructure/adapters/plugin-system.js"
import { getMessageConfig, getProtocolConfig } from "../../utils/typespec-helpers.js"
import { createChannelDefinition } from "../../utils/asyncapi-helpers.js"
import { convertModelToSchema, convertTypeToSchemaType } from "../../utils/schema-conversion.js"
import type {SecurityConfig} from "../decorators/securityConfig.js"
import type {ProtocolType} from "../../infrastructure/adapters/protocol-type.js"

// Standardized error handling
import type { StandardizedError } from "../../utils/standardized-errors.js"
import {ProtocolBindingFactory} from "../../infrastructure/adapters/protocol-binding-factory.js"

/**
 * ProcessingService - Core TypeSpec to AsyncAPI Transformation
 * 
 * Handles transformation of discovered TypeSpec elements into AsyncAPI structures:
 * - Operations -> AsyncAPI channels, operations, and messages
 * - Message models -> AsyncAPI components/messages and schemas
 * - Security configs -> AsyncAPI components/securitySchemes
 * 
 * Uses Effect.TS for functional error handling and comprehensive logging
 * 
 * MODERN FUNCTIONAL ARCHITECTURE - Domain-Driven Design Patterns
 * - Pure functional composition with Effect.TS
 * - Railway programming for error handling
 * - Immutable data transformations
 * - Clean separation of concerns
 */

/**
 * Process operations and add to AsyncAPI document
 * 
 * EXTRACTED FROM MONOLITHIC FILE: lines 693-708 (processOperationsEffectSync)
 * Enhanced with plugin system integration for protocol bindings
 * 
 * @param operations - Operations discovered from TypeSpec AST
 * @param asyncApiDoc - AsyncAPI document to update
 * @param program - TypeSpec program for context
 * @returns Effect containing processing count
 */
export const processOperations = (
	operations: Operation[], 
	asyncApiDoc: AsyncAPIObject, 
	program: Program
): Effect.Effect<number, StandardizedError> => {
		return Effect.gen(function* () {
			yield* Effect.log(`🏗️ Processing ${operations.length} operations with plugin system...`)

			// Process each operation with functional composition using Effect.all
			yield* Effect.all(
				operations.map(op => 
					Effect.sync(() => processSingleOperation(op, asyncApiDoc, program))
				)
			)

			yield* Effect.log(`📊 Processed ${operations.length} operations successfully`)
			return operations.length
		})
	}

	/**
	 * Process message models and add to AsyncAPI document
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: (processMessageModelsEffectSync)
	 * Transforms TypeSpec models with @message decorators to AsyncAPI messages/schemas
	 * 
	 * Enhanced with Effect.all parallel processing for optimal performance
	 * 
	 * @param messageModels - Message models discovered from TypeSpec AST
	 * @param asyncApiDoc - AsyncAPI document to update
	 * @param program - TypeSpec program for context
	 * @returns Effect containing processing count
	 */
export const processMessageModels = (messageModels: Model[], asyncApiDoc: AsyncAPIObject, program: Program): Effect.Effect<number, never> => {
		return Effect.gen(function* () {
			yield* Effect.log(`🎯 Processing ${messageModels.length} message models with functional composition...`)

			// Process each message model with functional composition using Effect.all
			yield* Effect.all(
				messageModels.map(model =>
					Effect.sync(() => processSingleMessageModel(model, asyncApiDoc, program))
				)
			)

			yield* Effect.log(`📊 Processed ${messageModels.length} message models successfully`)
			return messageModels.length
		})
	}

	/**
	 * Process security configurations and add to AsyncAPI document
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: (processSecurityConfigsEffectSync)  
	 * Transforms TypeSpec @security decorators to AsyncAPI securitySchemes
	 * 
	 * Enhanced with Effect.all parallel processing for optimal performance
	 * 
	 * @param securityConfigs - Security configs discovered from TypeSpec AST
	 * @param asyncApiDoc - AsyncAPI document to update
	 * @returns Effect containing processing count
	 */
export const processSecurityConfigs = (securityConfigs: SecurityConfig[], asyncApiDoc: AsyncAPIObject): Effect.Effect<number, never> => {
		return Effect.gen(function* () {
			yield* Effect.log(`🔐 Processing ${securityConfigs.length} security configurations with functional composition...`)

			// Process each security config with functional composition using Effect.all
			yield* Effect.all(
				securityConfigs.map(config =>
					Effect.sync(() => processSingleSecurityConfig(config, asyncApiDoc))
				)
			)

			yield* Effect.log(`📊 Processed ${securityConfigs.length} security configurations successfully`)
			return securityConfigs.length
		})
	}

	/**
	 * Transform single operation to AsyncAPI structures
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: processSingleOperation method
	 * Creates channels, operations, and messages for each TypeSpec operation
	 * 
	 * @param op - TypeSpec operation to process
	 * @param asyncApiDoc - AsyncAPI document to update
	 * @param program - TypeSpec program for decorator access
	 */
const processSingleOperation = (op: Operation, asyncApiDoc: AsyncAPIObject, program: Program): string => {
		const { operationType, channelPath } = extractOperationMetadata(op, program)
		const protocolConfig = getProtocolConfig(program, op)

		Effect.log(`🔍 Operation ${op.name}: type=${operationType ?? 'none'}, channel=${channelPath ?? 'default'}`)
		
		// Generate protocol bindings if protocol config exists
		let channelBindings = undefined
		let operationBindings = undefined
		let messageBindings = undefined
		
		if (protocolConfig) {
			Effect.log(`🔧 Protocol config found: ${protocolConfig.protocol}`)
			const protocolType = protocolConfig.protocol as ProtocolType
			const protocolName = protocolConfig.protocol as AsyncAPIProtocolType
			
			// Try plugin system first, fallback to ProtocolBindingFactory
			const bindingData = { config: protocolConfig.binding ?? {} }
			
			// Generate channel bindings - Plugin system preferred
			const channelBindingResult = Effect.runSync(generateProtocolBinding(protocolName, 'channel', bindingData).pipe(Effect.catchAll(() => Effect.succeed(null))))
			channelBindings = channelBindingResult ?? ProtocolBindingFactory.createChannelBindings(protocolType, protocolConfig.binding ?? {})
			
			// Generate operation bindings - Plugin system preferred
			const operationBindingResult = Effect.runSync(generateProtocolBinding(protocolName, 'operation', bindingData).pipe(Effect.catchAll(() => Effect.succeed(null))))
			operationBindings = operationBindingResult ?? ProtocolBindingFactory.createOperationBindings(protocolType, protocolConfig.binding ?? {})
			
			// Generate message bindings - Plugin system preferred
			const messageBindingResult = Effect.runSync(generateProtocolBinding(protocolName, 'message', bindingData).pipe(Effect.catchAll(() => Effect.succeed(null))))
			messageBindings = messageBindingResult ?? ProtocolBindingFactory.createMessageBindings(protocolType, protocolConfig.binding ?? {})
			
			if (channelBindings) {
				Effect.log(`✅ Channel bindings created for ${protocolType} ${channelBindingResult ? '(plugin)' : '(factory)'}`)
			}
			if (operationBindings) {
				Effect.log(`✅ Operation bindings created for ${protocolType} ${operationBindingResult ? '(plugin)' : '(factory)'}`)
			}
			if (messageBindings) {
				Effect.log(`✅ Message bindings created for ${protocolType} ${messageBindingResult ? '(plugin)' : '(factory)'}`)
			}
		}

		// FIXED: Use channel path from @channel decorator instead of hardcoded prefix
		// channelPath comes from extractOperationMetadata which reads the @channel decorator state
		const channelName = channelPath
		const action: "send" | "receive" = operationType === "subscribe" ? "receive" : "send"

		// Add channel to document - use shared helper to eliminate duplication
		asyncApiDoc.channels ??= {}
		const { definition } = createChannelDefinition(op, program)
		
		// CRITICAL FIX: Add protocol bindings to channel definition
		if (channelBindings) {
			definition.bindings = channelBindings
		}
		
		asyncApiDoc.channels[channelName] = definition

		// Add operation to document
		asyncApiDoc.operations ??= {}
		//TODO: HARDCODED MESSAGE TEMPLATES! EXTRACT TO CONSTANTS!
		//TODO: CRITICAL DUPLICATION - Template strings scattered throughout codebase!
		//TODO: I18N VIOLATION - Hardcoded English messages won't work for international teams!
		//TODO: CONFIGURATION FAILURE - Message templates should be configurable!
		const operationDef: OperationObject = {
			action: action,
			channel: { $ref: `#/channels/${channelName}` },
			summary: `Operation ${op.name}`,
			description: `TypeSpec operation with ${op.parameters.properties.size} parameters`,
		}
		
		// CRITICAL FIX: Add protocol bindings to operation definition
		if (operationBindings) {
			operationDef.bindings = operationBindings
		}
		
		asyncApiDoc.operations[op.name] = operationDef

		// Add message to components
		asyncApiDoc.components ??= {}
		asyncApiDoc.components.messages ??= {}
		const messageDef: Partial<MessageObject> = {
			name: `${op.name}Message`,
			title: `${op.name} Message`,
			summary: `Message for ${op.name} operation`,
			//TODO: HARDCODED CONTENT TYPE! NOT ALL ASYNCAPI MESSAGES ARE JSON!
			//TODO: CRITICAL ASSUMPTION FAILURE - Assumes all messages are JSON without validation!
			//TODO: BUSINESS LOGIC VIOLATION - Different protocols use different content types!
			//TODO: CONFIGURATION MISSING - Content type should be configurable per message/protocol!
			contentType: "application/json",
		}
		
		// CRITICAL FIX: Process return type and add payload schema
		if (op.returnType) {
			Effect.log(`🔍 Operation ${op.name} return type: ${op.returnType.kind}`)
			if (op.returnType.kind === "Model") {
				const model = op.returnType
				Effect.log(`📋 Processing Model return type: ${model.name}`)
				
				// Add schema to components.schemas
				asyncApiDoc.components.schemas ??= {}
				asyncApiDoc.components.schemas[model.name] = convertModelToSchema(model, program)
				
				// Add payload reference to message
				messageDef.payload = {
					$ref: `#/components/schemas/${model.name}`
				}
				
				Effect.log(`✅ Added schema and payload for model: ${model.name}`)
			} else {
				Effect.log(`🔍 Non-model return type (${op.returnType.kind}) - generating inline schema`)
				// Handle non-model return types by converting to schema
				const schema = Effect.runSync(convertTypeToSchemaType(op.returnType, program))
				messageDef.payload = schema
			}
		} else {
			Effect.log(`⚠️ Operation ${op.name} has no return type - creating default payload`)
			// Default payload for operations without return type
			messageDef.payload = {
				type: "object" as const,
				description: `Payload for ${op.name} operation`
			}
		}
		
		// CRITICAL FIX: Add protocol bindings to message definition
		if (messageBindings) {
			messageDef.bindings = messageBindings
		}
		
		asyncApiDoc.components.messages[`${op.name}Message`] = messageDef

		Effect.log(`✅ Processed operation: ${op.name} (${action})`)
		return `Processed operation: ${op.name}`
	}

	/**
	 * Transform single message model to AsyncAPI structures
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: processSingleMessageModel method
	 * Creates AsyncAPI messages and schemas from TypeSpec models
	 * 
	 * @param model - TypeSpec model to process
	 * @param asyncApiDoc - AsyncAPI document to update
	 * @param program - TypeSpec program for decorator access
	 */
const processSingleMessageModel = (model: Model, asyncApiDoc: AsyncAPIObject, program: Program): string => {
		const messageConfig = getMessageConfig(program, model)
		
		if (!messageConfig) {
			Effect.log(`⚠️ No message config found for model: ${model.name}`)
			return `No config for ${model.name}`
		}

		Effect.log(`🎯 Processing message model: ${model.name}`)

		// Ensure components.messages exists
		if (!asyncApiDoc.components?.messages) {
			asyncApiDoc.components ??= {}
			asyncApiDoc.components.messages = {}
		}

		const messageId = messageConfig.name ?? model.name

		// CRITICAL FIX: Add schema to components.schemas first!
		asyncApiDoc.components.schemas ??= {}
		asyncApiDoc.components.schemas[model.name] = convertModelToSchema(model, program)
		Effect.log(`✅ Added schema for message model: ${model.name}`)

		// Add message to components.messages with REAL configuration
		asyncApiDoc.components.messages[messageId] = {
			name: messageId,
			title: messageConfig.title ?? messageId,
			contentType: messageConfig.contentType ?? "application/json",
			payload: {
				$ref: `#/components/schemas/${model.name}`,
			},
			// Use conditional spread to avoid exactOptionalPropertyTypes violations
			...(messageConfig.summary ? { summary: messageConfig.summary } : {}),
			...(messageConfig.description ? { description: messageConfig.description } : {}),
			...(messageConfig.examples ? { examples: messageConfig.examples } : {}),
			...(messageConfig.headers ? { headers: { $ref: messageConfig.headers } } : {}),
			...(messageConfig.correlationId ? { correlationId: { $ref: messageConfig.correlationId } } : {}),
			...(messageConfig.bindings ? { bindings: messageConfig.bindings } : {}),
		}

		Effect.log(`✅ Added message: ${messageId}`)
		return `Processed message model: ${model.name}`
	}

	/**
	 * Transform single security config to AsyncAPI structures
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: processSingleSecurityConfig method  
	 * Creates AsyncAPI securitySchemes from TypeSpec security configurations
	 * 
	 * @param config - Security configuration to process
	 * @param asyncApiDoc - AsyncAPI document to update
	 */
const processSingleSecurityConfig = (config: SecurityConfig, asyncApiDoc: AsyncAPIObject): string => {
		Effect.log(`🔐 Processing security config: ${config.name}`)

		// Ensure components.securitySchemes exists
		if (!asyncApiDoc.components?.securitySchemes) {
			asyncApiDoc.components ??= {}
			asyncApiDoc.components.securitySchemes = {}
		}

		// Add security scheme to components.securitySchemes
		asyncApiDoc.components.securitySchemes[config.name] = createAsyncAPISecurityScheme(config)

		Effect.log(`✅ Added security scheme: ${config.name} (${config.scheme.type})`)
		return `Processed security config: ${config.name}`
	}

	/**
	 * Extract operation metadata from TypeSpec decorators
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: extractOperationMetadata method
	 * Uses TypeSpec stateMap to access @publish/@subscribe and @channel decorator data
	 * 
	 * @param op - TypeSpec operation
	 * @param program - TypeSpec program for stateMap access
	 * @returns Operation type and channel path from decorators
	 */
const extractOperationMetadata = (op: Operation, program: Program): {
		operationType: string | undefined,
		channelPath: string
	} => {
		// Access decorator state via TypeSpec stateMap - CRITICAL for decorator processing
		const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
		const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)

		const operationType = operationTypesMap.get(op) as string | undefined
		const decoratedChannelPath = channelPathsMap.get(op) as string | undefined
		
		// Default channel path if not specified in @channel decorator
		const channelPath = decoratedChannelPath ?? `/${op.name.toLowerCase()}`

		return { operationType, channelPath }
	}

	/**
	 * Create AsyncAPI security scheme from SecurityConfig
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: createAsyncAPISecurityScheme method
	 * Maps TypeSpec security scheme types to AsyncAPI v3 specification
	 * 
	 * @param config - Security configuration with scheme details
	 * @returns AsyncAPI SecuritySchemeObject
	 */
const createAsyncAPISecurityScheme = (config: SecurityConfig): SecuritySchemeObject => {
		const scheme = config.scheme

		// Map TypeSpec scheme types to AsyncAPI v3 types
		switch (scheme.type) {
			case "apiKey":
				// AsyncAPI v3 has different apiKey types based on location
				if (scheme.in === "user" || scheme.in === "password") {
					return {
						type: "userPassword",
						description: scheme.description,
					} as SecuritySchemeObject
				} else {
					return {
						type: "apiKey",
						in: scheme.in as "user" | "password",
						description: scheme.description,
					} as SecuritySchemeObject
				}

			case "http":
				return {
					type: "http",
					scheme: scheme.scheme,
					bearerFormat: scheme.bearerFormat,
					description: scheme.description,
				} as SecuritySchemeObject

			case "oauth2": {
				// Transform OAuth flows to ensure all required properties are present
				type OAuthFlowTransformed = {
					authorizationUrl?: string;
					tokenUrl?: string;
					refreshUrl?: string;
					availableScopes: Record<string, string>;
				};
				
				const transformedFlows: {
					implicit?: OAuthFlowTransformed;
					password?: OAuthFlowTransformed;
					clientCredentials?: OAuthFlowTransformed;
					authorizationCode?: OAuthFlowTransformed;
				} = {}
				
				if (scheme.flows.implicit) {
					transformedFlows.implicit = {
						...scheme.flows.implicit,
						availableScopes: scheme.flows.implicit.scopes ?? {}
					}
				}
				if (scheme.flows.password) {
					transformedFlows.password = {
						...scheme.flows.password,
						availableScopes: scheme.flows.password.scopes ?? {}
					}
				}
				if (scheme.flows.clientCredentials) {
					transformedFlows.clientCredentials = {
						...scheme.flows.clientCredentials,
						availableScopes: scheme.flows.clientCredentials.scopes ?? {}
					}
				}
				if (scheme.flows.authorizationCode) {
					transformedFlows.authorizationCode = {
						...scheme.flows.authorizationCode,
						availableScopes: scheme.flows.authorizationCode.scopes ?? {}
					}
				}
				
				return {
					type: "oauth2",
					flows: transformedFlows,
					description: scheme.description,
				} as SecuritySchemeObject
			}

			case "openIdConnect":
				return {
					type: "openIdConnect",
					openIdConnectUrl: scheme.openIdConnectUrl,
					description: scheme.description,
				} as SecuritySchemeObject

			case "sasl":
				return {
					type: "plain",
					description: scheme.description,
				} as SecuritySchemeObject

			case "x509":
				return {
					type: "X509",
					description: scheme.description,
				} as SecuritySchemeObject

			case "symmetricEncryption":
				return {
					type: "symmetricEncryption",
					description: scheme.description,
				} as SecuritySchemeObject

			case "asymmetricEncryption":
				return {
					type: "asymmetricEncryption",
					description: scheme.description,
				} as SecuritySchemeObject

			default:
				// This should never be reached due to TypeScript exhaustiveness checking
				Effect.log(`⚠️ Unknown security scheme type, using apiKey fallback`)
				return {
					type: "apiKey",
					in: "user",
					description: `Security scheme ${config.name}`,
				} as SecuritySchemeObject
		}
	}

	/**
	 * Execute complete processing pipeline
	 * 
	 * Orchestrates processing of all discovered elements in proper order
	 * 
	 * @param operations - Discovered operations
	 * @param messageModels - Discovered message models
	 * @param securityConfigs - Discovered security configs
	 * @param asyncApiDoc - AsyncAPI document to update
	 * @param program - TypeSpec program for context
	 * @returns Effect with processing summary
	 */
export const executeProcessing = (
		operations: Operation[], 
		messageModels: Model[], 
		securityConfigs: SecurityConfig[],
		asyncApiDoc: AsyncAPIObject, 
		program: Program
	): Effect.Effect<{ operationsProcessed: number, messageModelsProcessed: number, securityConfigsProcessed: number, totalProcessed: number }, StandardizedError> => {
		return Effect.gen(function* () {
			yield* Effect.log(`🚀 Starting complete TypeSpec processing pipeline with parallel processing...`)

			// Execute message models and security configs in parallel first (no dependencies)
			// Operations depend on message schemas, so they run after message models are processed
			const [messageCount, securityCount] = yield* Effect.all([
				processMessageModels(messageModels, asyncApiDoc, program),
				processSecurityConfigs(securityConfigs, asyncApiDoc)
			])

			// Process operations after message models to ensure schemas are available
			const operationCount = yield* processOperations(operations, asyncApiDoc, program)

			const summary = {
				operationsProcessed: operationCount,
				messageModelsProcessed: messageCount,
				securityConfigsProcessed: securityCount,
				totalProcessed: operationCount + messageCount + securityCount
			}

			yield* Effect.log(`✅ Processing complete: ${summary.totalProcessed} total elements processed (parallel optimization)`)

			return summary
		})
	}

// Add ProcessingService class export for compatibility
export class ProcessingService {
	static processOperations = processOperations
	static processMessageModels = processMessageModels
	static processSecurityConfigs = processSecurityConfigs
	static executeProcessing = executeProcessing
}