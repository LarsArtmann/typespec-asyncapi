/**
 * Configuration for @correlationId decorator
 * TODO: Improve types!
 */
export type CorrelationIdConfig = {
	/** JSONPointer location of correlation ID in message (e.g., "$message.header#/correlationId") */
	location: string;
	/** Human-readable description of the correlation ID */
	description?: string;
	/** Whether correlation ID is required or optional */
	required?: boolean;
	/** JSON Schema validation for correlation ID format */
	schema?: {
		type: 'string' | 'number';
		pattern?: string;
		format?: 'uuid' | 'int32' | 'int64' | 'custom';
		minLength?: number;
		maxLength?: number;
	};
}