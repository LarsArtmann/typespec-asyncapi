/**
 * Configuration for @header decorator
 * TODO: Improve types!
 */
export type HeaderConfig = {
	/** Header name in the message (defaults to property name) */
	name?: string;
	/** Human-readable description of the header */
	description?: string;
	/** Whether header is required or optional */
	required?: boolean;
	/** Header type information */
	type?: {
		/** JSON Schema type */
		type: 'string' | 'number' | 'boolean';
		/** Format specification */
		format?: string;
		/** Pattern for string validation */
		pattern?: string;
	};
}