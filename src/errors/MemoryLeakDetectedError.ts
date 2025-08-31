import {PerformanceError} from "./PerformanceError"
import type {Seconds} from "../performance/Durations"

export class MemoryLeakDetectedError extends PerformanceError {
	readonly _tag = "MemoryLeakDetectedError"
	override readonly name = "MemoryLeakDetectedError"

	constructor(
		public readonly leakRate: number, // bytes/second
		public readonly thresholdRate: number,
		public readonly duration: Seconds,
	) {
		super(`Memory leak detected: ${leakRate} bytes/sec > ${thresholdRate} bytes/sec over ${duration}s`)
	}
}