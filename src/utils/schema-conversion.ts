/**
 * Shared schema conversion utilities
 * Extracted from duplicated model-to-schema conversion logic
 */

import type {Model, ModelProperty, Program} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import type {SchemaObject} from "../types/index"

/**
 * Convert TypeSpec model to AsyncAPI schema object
 * Centralized from asyncapi-emitter.ts and emitter-with-effect.ts
 */
export function convertModelToSchema(model: Model, program: Program): SchemaObject {
	const properties: Record<string, SchemaObject> = {}
	const required: string[] = []

	model.properties.forEach((prop, name) => {
		properties[name] = convertPropertyToSchema(prop, program, name)

		if (!prop.optional) {
			required.push(name)
		}
	})

	const schema: SchemaObject = {
		type: "object",
		description: getDoc(program, model) ?? `Schema ${model.name}`,
		properties,
	}

	if (required.length > 0) {
		schema.required = required
	}

	return schema
}

/**
 * Convert TypeSpec model property to AsyncAPI schema property
 * Extracted common logic for type conversion
 */
export function convertPropertyToSchema(prop: ModelProperty, program: Program, propName: string): SchemaObject {
	const propSchema: SchemaObject = {
		description: getDoc(program, prop) ?? `Property ${propName}`,
	}

	// Determine type based on TypeSpec property type
	if (prop.type.kind === "String") {
		propSchema.type = "string"
	} else if (prop.type.kind === "Number") {
		propSchema.type = "number"
	} else if (prop.type.kind === "Boolean") {
		propSchema.type = "boolean"
	} else if (prop.type.kind === "Model") {
		if (prop.type.name === "utcDateTime") {
			propSchema.type = "string"
			propSchema.format = "date-time"
		} else {
			propSchema.type = "object"
		}
	} else {
		propSchema.type = "object"
	}

	return propSchema
}

/**
 * Get simplified property type information
 * Used by asyncapi-emitter.ts getPropertyType method
 */
export function getPropertyType(prop: ModelProperty): {
	type: "string" | "number" | "boolean" | "object" | "array" | "null" | "integer",
	format?: string
} {
	let propType: "string" | "number" | "boolean" | "object" | "array" | "null" | "integer" = "string" // Default
	let format: string | undefined

	if (prop.type.kind === "String") propType = "string"
	else if (prop.type.kind === "Number") propType = "number"
	else if (prop.type.kind === "Boolean") propType = "boolean"
	else if (prop.type.kind === "Model" && prop.type.name === "utcDateTime") {
		propType = "string"
		format = "date-time"
	}

	return format ? {type: propType, format} : {type: propType}
}

/**
 * Generate basic schema properties from model
 * Simplified version used in integration-example.ts
 */
export function generateSchemaPropertiesFromModel(_model: Model): Record<string, unknown> {
	const properties: Record<string, unknown> = {}

	//TODO: FUCKING IMPLEMENT THIS!!! ASAP

	// Basic properties that are commonly needed
	properties['id'] = {
		type: "string",
		description: "Unique identifier",
	}
	properties['timestamp'] = {
		type: "string",
		format: "date-time",
		description: "Timestamp",
	}

	// In production, would iterate through model.properties
	// For now, return basic structure
	return properties
}
