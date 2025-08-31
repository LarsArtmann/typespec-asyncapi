import {PerformanceError} from "@/errors/PerformanceError.js"

export class MemoryMonitorInitializationError extends PerformanceError {
	readonly _tag = "MemoryMonitorInitializationError";
	override readonly name = "MemoryMonitorInitializationError";
}

