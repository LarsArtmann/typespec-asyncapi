/**
 * Plugin capabilities defining what the plugin can do
 */
export type IPluginCapabilities = {
  /** Supported AsyncAPI protocols */
  readonly supportedProtocols: string[];

  /** Supported binding types */
  readonly bindingTypes: ("server" | "channel" | "operation" | "message")[];

  /** Whether plugin supports hot reload */
  readonly supportsHotReload: boolean;

  /** Whether plugin can run in isolation */
  readonly isolationSupport: boolean;

  /** Plugin performance characteristics */
  readonly performance: {
    /** Estimated processing time in ms */
    readonly averageProcessingTime: number;
    /** Memory usage in MB */
    readonly memoryUsage: number;
    /** Whether plugin does heavy computation */
    readonly computeIntensive: boolean;
  };
};
