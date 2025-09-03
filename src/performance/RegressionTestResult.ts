import type {PerformanceBaseline} from "./PerformanceBaseline.js"
import type {PerformanceMetrics} from "./PerformanceMetrics.js"
import type {RegressionDetection} from "./RegressionDetection.js"

//TODO: Can we do better with our Types?
export type RegressionTestResult = {
	testName: string
	current: PerformanceMetrics
	baseline: PerformanceBaseline
	regressions: RegressionDetection[]
	passed: boolean
	timestamp: Date
}