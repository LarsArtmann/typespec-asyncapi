import type {LogLevel} from "./log-level.js"

/**
 * Structured logging configuration
 */
export type LoggingConfig = {
	readonly level: LogLevel
	readonly format: 'json' | 'text' | 'structured'
	readonly output: 'console' | 'file' | 'syslog' | 'remote'
	readonly filePath?: string
	readonly maxFileSize?: string
	readonly maxFiles?: number
	readonly remoteEndpoint?: string
	readonly fields?: Record<string, unknown>
	readonly correlationId?: boolean
}