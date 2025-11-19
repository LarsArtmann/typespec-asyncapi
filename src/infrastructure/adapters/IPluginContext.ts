import type { IPluginRegistry } from "./IPluginRegistry.js";

/**
 * Plugin initialization context providing access to system resources
 */
export type IPluginContext = {
  /** Plugin configuration from user */
  readonly config: Record<string, unknown>;

  /** System logger for plugin diagnostics */
  readonly logger: {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  };

  /** Plugin registry for accessing other plugins */
  readonly registry: IPluginRegistry;

  /** Plugin's working directory for temporary files */
  readonly workingDirectory: string;
};
