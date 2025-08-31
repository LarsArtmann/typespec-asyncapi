/**
 * Legacy validation functions for backward compatibility
 * @deprecated These functions are maintained for backward compatibility only
 */

import type {LegacyValidationResult} from "./types"
import {createDeprecatedValidator} from "./validator-utils"

/**
 * @deprecated Use AsyncAPIValidator class instead
 */
export async function validateAsyncAPIFile(filePath: string): Promise<LegacyValidationResult> {
	const validator = await createDeprecatedValidator()
	const result = await validator.validateFile(filePath)

	return {
		valid: result.valid,
		errors: result.errors,
		warnings: result.warnings,
	}
}

/**
 * @deprecated Use AsyncAPIValidator class instead
 */
export async function validateAsyncAPIString(content: string): Promise<LegacyValidationResult> {
	const validator = await createDeprecatedValidator()
	const result = await validator.validate(content)

	return {
		valid: result.valid,
		errors: result.errors,
		warnings: result.warnings,
	}
}
