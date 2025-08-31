import {PerformanceError} from "@/errors/PerformanceError"

export class MetricsInitializationError extends PerformanceError {
	readonly _tag = "MetricsInitializationError"
	override readonly name = "MetricsInitializationError"
}