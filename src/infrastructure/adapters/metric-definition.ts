import type { MetricType } from "./metric-type.js";

/**
 * Metric definition for Prometheus
 */
export type MetricDefinition = {
  readonly name: string;
  readonly type: MetricType;
  readonly description: string;
  readonly labels?: string[];
  readonly buckets?: number[]; // For histograms
  readonly quantiles?: Record<string, number>; // For summaries
};
