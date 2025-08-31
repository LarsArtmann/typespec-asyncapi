import {PerformanceError} from "./PerformanceError"

export class MetricsInitializationError extends PerformanceError {
	readonly _tag = "MetricsInitializationError"
	override readonly name = "MetricsInitializationError"
}