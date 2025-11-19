/**
 * Monitoring event for plugin communication
 */
export type MonitoringEvent = {
  readonly type: "metric" | "log" | "alert" | "health";
  readonly timestamp: Date;
  readonly source: string;
  readonly data: unknown;
  readonly severity?: "low" | "medium" | "high" | "critical";
};
