import type { StandardizedError } from "../../domain/models/StandardizedError.js";

export class PluginError extends Error {
  readonly _tag = "PluginError";

  constructor(
    override readonly message: string,
    readonly pluginName?: string,
    readonly operation?: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message);
  }

  toStandardizedError(): StandardizedError {
    return {
      category: "plugin_error",
      code: "PLUGIN_OPERATION_FAILED",
      message: this.message,
      details: {
        pluginName: this.pluginName,
        operation: this.operation,
      },
      timestamp: new Date(),
      context: this.context ?? {},
      recoverable: true, // Plugins can be isolated
    };
  }
}
