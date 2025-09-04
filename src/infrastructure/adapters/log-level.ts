export const LOG_LEVEL = {
	TRACE: "trace",
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
	FATAL: "fatal",
} as const


export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL]