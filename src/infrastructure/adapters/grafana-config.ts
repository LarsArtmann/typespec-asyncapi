import type { PanelDefinition } from "./panel-definition.js";

/**
 * Grafana dashboard configuration
 */
export type GrafanaConfig = {
  readonly url: string;
  readonly apiKey?: string;
  readonly orgId?: number;
  readonly dashboardTemplate?: string;
  readonly datasource?: string;
  readonly refreshInterval?: string;
  readonly panels?: PanelDefinition[];
};
