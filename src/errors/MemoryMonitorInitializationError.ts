import {PerformanceError} from "@/errors/PerformanceError"

export class MemoryMonitorInitializationError extends PerformanceError {
	readonly _tag = "MemoryMonitorInitializationError"
	override readonly name = "MemoryMonitorInitializationError"
}

