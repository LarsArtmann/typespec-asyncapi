import {PerformanceError} from "./PerformanceError"

export class MemoryMonitorInitializationError extends PerformanceError {
	readonly _tag = "MemoryMonitorInitializationError"
	override readonly name = "MemoryMonitorInitializationError"
}

