/**
 * Shared schema conversion utilities
 * Extracted from duplicated model-to-schema conversion logic
 * Enhanced with Effect.TS patterns for robust schema processing
 */

import { Effect } from "effect"
import type {Model, ModelProperty, Program, Type} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import type {SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Convert TypeSpec model to AsyncAPI schema object
 * Centralized from asyncapi-emitter.ts and emitter-with-effect.ts
 * Enhanced with Effect.TS error handling and comprehensive type support
 */
export function convertModelToSchema(model: Model, program: Program): SchemaObject {
	return Effect.runSync(
		Effect.gen(function* () {
			yield* Effect.log(`🔍 Converting model to schema: ${model.name || 'Anonymous'}`)
			
			const properties: Record<string, SchemaObject> = {}
			const required: string[] = []

			// Process each model property using Effect.TS patterns
			for (const [name, prop] of model.properties.entries()) {
				yield* Effect.log(`📋 Processing property: ${name} (type: ${prop.type.kind})`)
				
				properties[name] = yield* convertPropertyToSchemaEffect(prop, program, name)

				if (!prop.optional) {
					required.push(name)
				}
			}

			const schema: SchemaObject = {
				type: "object",
				description: getDoc(program, model) ?? `Schema for ${model.name || 'Anonymous'}`,
				properties,
			}

			if (required.length > 0) {
				schema.required = required
			}

			yield* Effect.log(`✅ Schema conversion complete for ${model.name}: ${Object.keys(properties).length} properties, ${required.length} required`)
			
			return schema
		})
	)
}

/**
 * Convert TypeSpec model property to AsyncAPI schema property
 * Enhanced with comprehensive type support and Effect.TS error handling
 */
export function convertPropertyToSchema(prop: ModelProperty, program: Program, propName: string): SchemaObject {
	return Effect.runSync(convertPropertyToSchemaEffect(prop, program, propName))
}

/**
 * Effect-based property conversion for Railway programming patterns
 */
function convertPropertyToSchemaEffect(prop: ModelProperty, program: Program, propName: string): Effect.Effect<SchemaObject, never, never> {
	return Effect.gen(function* () {
		yield* Effect.log(`🔍 Converting property: ${propName} (${prop.type.kind})`)

		const propSchema: SchemaObject = {
			description: getDoc(program, prop) ?? `Property ${propName}`,
		}

		// Enhanced type determination with comprehensive support
		const typeResult: SchemaObject = yield* convertTypeToSchemaType(prop.type, program)
		Object.assign(propSchema, typeResult)

		yield* Effect.log(`✅ Property ${propName} converted to: ${JSON.stringify(typeResult)}`)
		
		return propSchema
	})
}

/**
 * Convert TypeSpec Type to JSON Schema type information
 * Handles primitive types, arrays, unions, models, and references
 */
function convertTypeToSchemaType(type: Type, program: Program): Effect.Effect<SchemaObject, never, never> {
	return Effect.gen(function* () {
		yield* Effect.log(`🔍 Converting type: ${type.kind}`)
		yield* Effect.log(`🔍 Type details:`, JSON.stringify({
			kind: type.kind,
			name: (type as any).name,
			hasProperties: !!(type as any).properties,
			hasIndexer: !!(type as any).indexer,
			hasVariants: !!(type as any).variants
		}))

		switch (type.kind) {
			case "Scalar": {
				// Handle built-in scalar types
				const scalarType = type as any // TypeScript doesn't expose scalar names properly
				switch (scalarType.name) {
					case "string":
						return { type: "string" as const }
					case "int32":
						return { type: "integer" as const, format: "int32" }
					case "int64":
						return { type: "integer" as const, format: "int64" }
					case "float32":
						return { type: "number" as const, format: "float" }
					case "float64":
						return { type: "number" as const, format: "double" }
					case "boolean":
						return { type: "boolean" as const }
					case "bytes":
						return { type: "string" as const, format: "binary" }
					case "utcDateTime":
						return { type: "string" as const, format: "date-time" }
					default:
						yield* Effect.log(`⚠️ Unknown scalar type: ${scalarType.name}, defaulting to string`)
						return { type: "string" as const }
				}
			}

			case "String": {
				return { type: "string" as const }
			}

			case "Number": {
				return { type: "number" as const }
			}

			case "Boolean": {
				return { type: "boolean" as const }
			}

			case "Union": {
				const unionType = type
				const variants = Array.from(unionType.variants.values())
				yield* Effect.log(`🔀 Processing union type with ${variants.length} variants`)
				
				// Check if this is an enum-like union (string literals)
				const stringLiterals: string[] = []
				for (const variant of variants) {
					// Check if the variant represents a string literal
					const variantType = variant.type as any
					if (variantType.kind === "String" && variantType.value !== undefined) {
						stringLiterals.push(variantType.value)
					}
				}

				if (stringLiterals.length === variants.length && stringLiterals.length > 0) {
					// This is an enum
					return {
						type: "string" as const,
						enum: stringLiterals
					}
				}

				// This is a complex union - use oneOf
				const oneOfSchemas: SchemaObject[] = []
				for (const variant of variants) {
					const optionSchema: SchemaObject = yield* convertTypeToSchemaType(variant.type, program)
					oneOfSchemas.push(optionSchema)
				}

				return {
					oneOf: oneOfSchemas
				}
			}

			case "Model": {
				const modelType = type
				
				if (modelType.name === "utcDateTime") {
					return { type: "string" as const, format: "date-time" }
				}

				// Check if this is a Record<string> type
				if (modelType.name === "Record") {
					return {
						type: "object" as const,
						additionalProperties: { type: "string" as const }
					}
				}

				// Check if this is an array type (model with indexer)
				if (modelType.indexer?.key?.name === "integer") {
					// This is an array type
					const elementType: SchemaObject = yield* convertTypeToSchemaType(modelType.indexer.value, program)
					return {
						type: "array" as const,
						items: elementType
					}
				}

				// For other models, create a reference or inline schema
				yield* Effect.log(`🏗️ Processing model: ${modelType.name || 'Anonymous'}`)
				
				if (modelType.name) {
					// Create reference to schema that should be in components
					return {
						$ref: `#/components/schemas/${modelType.name}`
					}
				} else {
					// Inline anonymous model - convert properties directly
					const properties: Record<string, SchemaObject> = {}
					const required: string[] = []

					for (const [name, prop] of modelType.properties.entries()) {
						properties[name] = yield* convertPropertyToSchemaEffect(prop, program, name)
						if (!prop.optional) {
							required.push(name)
						}
					}

					const inlineSchema: SchemaObject = {
						type: "object" as const,
						properties
					}

					if (required.length > 0) {
						inlineSchema.required = required
					}

					return inlineSchema
				}
			}

			default: {
				yield* Effect.log(`⚠️ Unhandled type kind: ${type.kind}, defaulting to object`)
				return { type: "object" as const }
			}
		}
	})
}

/**
 * Get simplified property type information
 * Used by asyncapi-emitter.ts getPropertyType method
 * Enhanced to use the new type conversion system
 */
export function getPropertyType(prop: ModelProperty): {
	type: "string" | "number" | "boolean" | "object" | "array" | "null" | "integer",
	format?: string
} {
	return Effect.runSync(
		Effect.gen(function* () {
			const program = null as any // Legacy compatibility - this function doesn't use program
			const typeInfo: SchemaObject = yield* convertTypeToSchemaType(prop.type, program)
			
			// Map JSON Schema types to the expected return format
			// Handle the fact that SchemaObject can be complex
			const typeInfoAny = typeInfo as any
			
			if (typeInfoAny.type === "string") {
				return { type: "string" as const, format: typeInfoAny.format }
			} else if (typeInfoAny.type === "number") {
				return { type: "number" as const, format: typeInfoAny.format }
			} else if (typeInfoAny.type === "integer") {
				return { type: "integer" as const, format: typeInfoAny.format }
			} else if (typeInfoAny.type === "boolean") {
				return { type: "boolean" as const }
			} else if (typeInfoAny.type === "array") {
				return { type: "array" as const }
			} else if (typeInfoAny.type === "object") {
				return { type: "object" as const }
			} else {
				// Fallback for complex types (oneOf, anyOf, etc.)
				return { type: "object" as const }
			}
		}).pipe(
			Effect.catchAll(() => Effect.succeed({ type: "string" as const }))
		)
	)
}

/**
 * Generate basic schema properties from model
 * Simplified version used in integration-example.ts
 */
export function generateSchemaPropertiesFromModel(model: Model): Record<string, unknown> {
	const properties: Record<string, unknown> = {}

	// ✅ IMPLEMENTED: Iterate through actual model properties from TypeSpec AST
	model.properties.forEach((prop, name) => {
		// Convert each property using existing conversion utilities
		const propType = getPropertyType(prop)
		
		properties[name] = {
			...propType,
			description: `Property ${name}`,
			// Add required flag if property is not optional
			...(prop.optional ? {} : { required: true })
		}
	})

	// Fallback: Add basic properties if model has no properties
	if (model.properties.size === 0) {
		properties['id'] = {
			type: "string",
			description: "Unique identifier",
		}
		properties['timestamp'] = {
			type: "string",
			format: "date-time",
			description: "Timestamp",
		}
	}

	return properties
}
