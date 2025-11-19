/**
 * Monitoring query interface for retrieving metrics
 */
export type MonitoringQuery = {
  readonly metric?: string;
  readonly labels?: Record<string, string>;
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly aggregation?: "sum" | "avg" | "min" | "max" | "count";
  readonly groupBy?: string[];
};
