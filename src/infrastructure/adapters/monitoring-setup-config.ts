import type { MonitoringPluginConfig } from "./monitoring-plugin-config.js";

/**
 * Monitoring setup configuration for code generation
 */
export type MonitoringSetupConfig = {
  readonly plugins: MonitoringPluginConfig[];
  readonly globalConfig?: {
    serviceName?: string;
    environment?: string;
    version?: string;
    labels?: Record<string, string>;
  };
};
