export const MONITORING_TYPE = {
  PROMETHEUS: "prometheus",
  GRAFANA: "grafana",
  LOGGING: "logging",
  HEALTH_CHECK: "health_check",
  TRACING: "tracing",
  CUSTOM: "custom",
} as const;

export type MonitoringType =
  (typeof MONITORING_TYPE)[keyof typeof MONITORING_TYPE];
