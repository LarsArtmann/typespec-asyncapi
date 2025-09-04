/**
 * Validation error for cloud binding configurations
 */
export class CloudBindingValidationError extends Error {
	constructor(
		message: string,
		public readonly bindingType: string,
		public readonly field?: string,
	) {
		super(`${bindingType} binding validation error: ${message}`)
		this.name = 'CloudBindingValidationError'
	}
}