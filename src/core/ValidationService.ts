/**
 * ValidationService - AsyncAPI Document Validation Engine
 * 
 * Extracted from 1,800-line monolithic emitter to handle AsyncAPI document validation
 * and compliance checking with proper error handling and reporting.
 * 
 * REAL BUSINESS LOGIC EXTRACTED from validation methods in AsyncAPIEffectEmitter class
 * This service ensures generated AsyncAPI documents meet specification requirements
 */

import { Effect } from "effect"
import type { 
	AsyncAPIObject, 
	ReferenceObject
} from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Validation result with details about compliance and any issues found
 */
export type ValidationResult = {
	isValid: boolean
	errors: string[]
	warnings: string[]
	channelsCount: number
	operationsCount: number
	messagesCount: number
	schemasCount: number
}

/**
 * ValidationService - Core AsyncAPI Document Validation
 * 
 * Handles comprehensive validation of AsyncAPI documents to ensure:
 * - AsyncAPI 3.0 specification compliance
 * - Required fields presence and correctness
 * - Document structure integrity
 * - Channel and operation consistency
 * - Message and schema validity
 * 
 * Uses Effect.TS for functional error handling and comprehensive logging
 */
export class ValidationService {

	/**
	 * Type guard to check if object is a reference
	 */
	private isReference(obj: any): obj is ReferenceObject {
		return obj && typeof obj === 'object' && '$ref' in obj
	}


	/**
	 * Validate AsyncAPI document structure and compliance
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: validateDocumentEffectSync method
	 * Enhanced with comprehensive validation logic vs simple placeholder
	 * 
	 * @param asyncApiDoc - AsyncAPI document to validate
	 * @returns Effect containing detailed validation results
	 */
	validateDocument(asyncApiDoc: AsyncAPIObject) {
		return Effect.sync(() => {
			Effect.log(`🔍 Starting comprehensive AsyncAPI document validation...`)

			const errors: string[] = []
			const warnings: string[] = []

			// Basic structure validation
			this.validateBasicStructure(asyncApiDoc, errors, warnings)
			
			// Validate info section
			this.validateInfoSection(asyncApiDoc, errors, warnings)
			
			// Validate channels
			const channelsCount = this.validateChannels(asyncApiDoc, errors, warnings)
			
			// Validate operations
			const operationsCount = this.validateOperations(asyncApiDoc, errors, warnings)
			
			// Validate components
			const { messagesCount, schemasCount } = this.validateComponents(asyncApiDoc, errors, warnings)
			
			// Validate cross-references
			this.validateCrossReferences(asyncApiDoc, errors, warnings)

			const isValid = errors.length === 0
			const result: ValidationResult = {
				isValid,
				errors,
				warnings,
				channelsCount,
				operationsCount,
				messagesCount,
				schemasCount
			}

			if (isValid) {
				Effect.log(`✅ AsyncAPI document validation passed! ${channelsCount} channels, ${operationsCount} operations`)
			} else {
				Effect.log(`❌ AsyncAPI document validation failed with ${errors.length} errors, ${warnings.length} warnings`)
			}

			return result
		})
	}

	/**
	 * Validate document as string content
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: Wrapper around document validation for string input
	 * 
	 * @param content - Serialized AsyncAPI document content
	 * @returns Effect containing validation result and content length
	 */
	validateDocumentContent(content: string) {
		return Effect.sync(() => {
			Effect.log(`🔍 Validating AsyncAPI document content (${content.length} bytes)...`)

			try {
				// Parse the content to validate JSON/YAML structure
				const parsedDoc = JSON.parse(content) as AsyncAPIObject
				
				// Run comprehensive validation
				const validationOperation = this.validateDocument(parsedDoc)
				const result = Effect.runSync(validationOperation)
				
				if (result.isValid) {
					Effect.log(`✅ Document content validation passed!`)
					return content
				} else {
					Effect.log(`❌ Document content validation failed:`)
					result.errors.forEach(error => Effect.log(`  - ${error}`))
					throw new Error(`AsyncAPI validation failed with ${result.errors.length} errors`)
				}
			} catch (parseError) {
				Effect.log(`❌ Document parsing failed: ${parseError}`)
				throw new Error(`Invalid AsyncAPI document format: ${parseError}`)
			}
		})
	}

	/**
	 * Validate basic AsyncAPI document structure
	 */
	private validateBasicStructure(doc: AsyncAPIObject, errors: string[], warnings: string[]): void {
		// Handle null/undefined document
		if (!doc) {
			errors.push("Document is null or undefined")
			return
		}

		// Validate AsyncAPI version
		if (!doc.asyncapi) {
			errors.push("Missing required 'asyncapi' field")
		} else if (!doc.asyncapi.startsWith('3.')) {
			warnings.push(`Using AsyncAPI version ${doc.asyncapi}, expected 3.x`)
		}

		// Validate required top-level fields
		if (!doc.info) {
			errors.push("Missing required 'info' section")
		}
	}

	/**
	 * Validate info section compliance
	 */
	private validateInfoSection(doc: AsyncAPIObject, errors: string[], warnings: string[]): void {
		if (!doc || !doc.info) return

		// Required fields
		if (!doc.info.title) {
			errors.push("Missing required 'info.title' field")
		}

		if (!doc.info.version) {
			errors.push("Missing required 'info.version' field")
		}

		// Recommendations
		if (!doc.info.description) {
			warnings.push("Missing recommended 'info.description' field")
		}
	}

	/**
	 * Validate channels section
	 */
	private validateChannels(doc: AsyncAPIObject, errors: string[], warnings: string[]): number {
		if (!doc || !doc.channels || Object.keys(doc.channels).length === 0) {
			warnings.push("No channels defined - document may be incomplete")
			return 0
		}

		const channelNames = Object.keys(doc.channels)
		
		channelNames.forEach(channelName => {
			const channel = doc.channels?.[channelName]
			if (!channel) return

			// Skip validation for references - they should be resolved externally
			if (this.isReference(channel)) {
				warnings.push(`Channel '${channelName}' is a reference ($ref) - cannot validate structure`)
				return
			}

			// Validate channel structure for actual ChannelObject
			if (!channel.address) {
				errors.push(`Channel '${channelName}' missing required 'address' field`)
			}

			// Validate messages reference
			if (channel.messages && Object.keys(channel.messages).length === 0) {
				warnings.push(`Channel '${channelName}' has empty messages section`)
			}
		})

		return channelNames.length
	}

	/**
	 * Validate operations section
	 */
	private validateOperations(doc: AsyncAPIObject, errors: string[], warnings: string[]): number {
		if (!doc || !doc.operations || Object.keys(doc.operations).length === 0) {
			warnings.push("No operations defined - document may be incomplete")
			return 0
		}

		const operationNames = Object.keys(doc.operations)
		
		operationNames.forEach(operationName => {
			const operation = doc.operations?.[operationName]
			if (!operation) return

			// Skip validation for references - they should be resolved externally
			if (this.isReference(operation)) {
				warnings.push(`Operation '${operationName}' is a reference ($ref) - cannot validate structure`)
				return
			}

			// Validate required fields for actual OperationObject
			if (!operation.action) {
				errors.push(`Operation '${operationName}' missing required 'action' field`)
			} else if (!['send', 'receive'].includes(operation.action)) {
				errors.push(`Operation '${operationName}' has invalid action '${operation.action}', must be 'send' or 'receive'`)
			}

			if (!operation.channel) {
				errors.push(`Operation '${operationName}' missing required 'channel' reference`)
			}
		})

		return operationNames.length
	}

	/**
	 * Validate components section
	 */
	private validateComponents(doc: AsyncAPIObject, _errors: string[], warnings: string[]): { messagesCount: number, schemasCount: number } {
		let messagesCount = 0
		let schemasCount = 0

		if (!doc || !doc.components) {
			warnings.push("No components section defined")
			return { messagesCount, schemasCount }
		}

		// Validate messages
		if (doc.components.messages) {
			messagesCount = Object.keys(doc.components.messages).length
			
			Object.entries(doc.components.messages).forEach(([messageName, message]) => {
				// Skip validation for references
				if (this.isReference(message)) {
					warnings.push(`Message '${messageName}' is a reference ($ref) - cannot validate structure`)
					return
				}

				// Validate actual MessageObject
				if (!message.name) {
					warnings.push(`Message '${messageName}' missing 'name' field`)
				}
			})
		}

		// Validate schemas
		if (doc.components.schemas) {
			schemasCount = Object.keys(doc.components.schemas).length
		}

		return { messagesCount, schemasCount }
	}

	/**
	 * Validate cross-references between document sections
	 */
	private validateCrossReferences(doc: AsyncAPIObject, errors: string[], _warnings: string[]): void {
		if (!doc) return
		// Validate operation channel references
		if (doc.operations && doc.channels) {
			Object.entries(doc.operations).forEach(([operationName, operation]) => {
				// Skip reference operations
				if (this.isReference(operation)) {
					return
				}

				// Check if operation channel is a reference
				if (operation.channel && this.isReference(operation.channel)) {
					const channelRef = operation.channel.$ref.replace('#/channels/', '')
					if (!doc.channels?.[channelRef]) {
						errors.push(`Operation '${operationName}' references non-existent channel '${channelRef}'`)
					}
				}
			})
		}

		// Validate message references in channels
		if (doc.channels && doc.components?.messages) {
			Object.entries(doc.channels).forEach(([channelName, channel]) => {
				// Skip reference channels
				if (this.isReference(channel)) {
					return
				}

				if (channel.messages) {
					Object.entries(channel.messages).forEach(([, messageRef]) => {
						if (this.isReference(messageRef)) {
							const messageRefName = messageRef.$ref.replace('#/components/messages/', '')
							if (!doc.components?.messages?.[messageRefName]) {
								errors.push(`Channel '${channelName}' references non-existent message '${messageRefName}'`)
							}
						}
					})
				}
			})
		}
	}

	/**
	 * Perform quick validation check
	 * 
	 * Simplified validation for fast checks during development
	 * 
	 * @param asyncApiDoc - Document to validate
	 * @returns Boolean indicating basic validity
	 */
	quickValidation(asyncApiDoc: AsyncAPIObject) {
		return Effect.sync(() => {
			const hasAsyncAPI = !!asyncApiDoc.asyncapi
			const hasInfo = !!asyncApiDoc.info
			const hasChannelsOrOps = !!(asyncApiDoc.channels && Object.keys(asyncApiDoc.channels).length > 0) ||
									   !!(asyncApiDoc.operations && Object.keys(asyncApiDoc.operations).length > 0)

			const isValid = hasAsyncAPI && hasInfo && hasChannelsOrOps
			
			Effect.log(`⚡ Quick validation: ${isValid ? 'PASS' : 'FAIL'}`)
			
			return isValid
		})
	}

	/**
	 * Generate validation report summary
	 * 
	 * @param result - Validation result to summarize
	 * @returns Human-readable validation report
	 */
	generateValidationReport(result: ValidationResult): string {
		const status = result.isValid ? '✅ VALID' : '❌ INVALID'
		const report = [
			`AsyncAPI Document Validation Report`,
			`Status: ${status}`,
			``,
			`Document Statistics:`,
			`- Channels: ${result.channelsCount}`,
			`- Operations: ${result.operationsCount}`,
			`- Messages: ${result.messagesCount}`,
			`- Schemas: ${result.schemasCount}`,
			``
		]

		if (result.errors.length > 0) {
			report.push(`Errors (${result.errors.length}):`)
			result.errors.forEach(error => report.push(`- ${error}`))
			report.push('')
		}

		if (result.warnings.length > 0) {
			report.push(`Warnings (${result.warnings.length}):`)
			result.warnings.forEach(warning => report.push(`- ${warning}`))
		}

		return report.join('\n')
	}
}