import {PerformanceError} from "./PerformanceError.js"

export class MetricsInitializationError extends PerformanceError {
	readonly _tag = "MetricsInitializationError"
	override readonly name = "MetricsInitializationError"
}