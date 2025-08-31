import {PerformanceError} from "@/errors/PerformanceError"

export class MetricsCollectionError extends PerformanceError {
	readonly _tag = "MetricsCollectionError"
	override readonly name = "MetricsCollectionError"
}