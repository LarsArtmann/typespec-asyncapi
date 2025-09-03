export const METRIC_TYPE = {
	COUNTER: "counter",
	GAUGE: "gauge",
	HISTOGRAM: "histogram",
	SUMMARY: "summary",
} as const


export type MetricType = typeof METRIC_TYPE[keyof typeof METRIC_TYPE]