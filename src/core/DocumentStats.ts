/**
 * Document statistics interface for AsyncAPI document analysis
 */
export interface DocumentStats {
	/** Total number of channels defined */
	readonly channelCount: number
	
	/** Total number of operations (publish + subscribe) */
	readonly operationCount: number
	
	/** Number of message schemas defined */
	readonly messageCount: number
	
	/** Number of servers configured */
	readonly serverCount: number
	
	/** Number of security schemes defined */
	readonly securitySchemeCount: number
	
	/** Document generation timestamp */
	readonly generatedAt: Date
	
	/** Total processing time in milliseconds */
	readonly processingTimeMs: number
	
	/** Memory usage in bytes during generation */
	readonly memoryUsageBytes?: number
}

/**
 * Creates initial document stats structure
 */
export const createDocumentStats = (
	overrides: Partial<DocumentStats> = {}
): DocumentStats => ({
	channelCount: 0,
	operationCount: 0,
	messageCount: 0,
	serverCount: 0,
	securitySchemeCount: 0,
	generatedAt: new Date(),
	processingTimeMs: 0,
	...overrides,
})