import type {PerformanceMetrics} from "./PerformanceMetrics.js"

//TODO: Can we do better with our Types?
export type RegressionDetection = {
	metric: keyof PerformanceMetrics
	currentValue: number
	baselineValue: number
	percentageChange: number
	threshold: number
	severity: "minor" | "moderate" | "major" | "critical"
	description: string
}