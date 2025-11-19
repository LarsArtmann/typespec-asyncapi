import type { Effect } from "effect";
import type { MonitoringDataPoint } from "./monitoring-data-point.js";

import type { MonitoringType } from "./monitoring-type.js";

/**
 * Core monitoring plugin interface
 * TODO: USE THIS SOMEWHERE??
 * TODO: IMPROVE THE TYPES??
 */
export type MonitoringPlugin = {
  readonly name: string;
  readonly version: string;
  readonly type: MonitoringType;
  readonly dependencies: string[];

  /**
   * Initialize the monitoring plugin with configuration
   */
  initialize(config: unknown): Effect.Effect<void, Error>;

  /**
   * Start the monitoring service
   */
  start(): Effect.Effect<void, Error>;

  /**
   * Stop the monitoring service gracefully
   */
  stop(): Effect.Effect<void, Error>;

  /**
   * Record a monitoring data point
   */
  recordMetric(dataPoint: MonitoringDataPoint): Effect.Effect<void, Error>;

  /**
   * Get current monitoring metrics
   */
  getMetrics(): Effect.Effect<MonitoringDataPoint[], Error>;

  /**
   * Validate monitoring configuration
   */
  validateConfig(config: unknown): Effect.Effect<boolean, Error>;

  /**
   * Generate monitoring setup code for the target runtime
   */
  generateSetupCode(
    runtime: "go" | "nodejs",
    config: unknown,
  ): Effect.Effect<string, Error>;

  /**
   * Generate monitoring configuration files
   */
  generateConfigFiles(): Effect.Effect<Record<string, string>, Error>;

  /**
   * Generate monitoring documentation
   */
  generateDocs(): Effect.Effect<string, Error>;
};
