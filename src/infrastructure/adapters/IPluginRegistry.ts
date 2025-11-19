import type { Effect } from "effect";
import type { IPlugin } from "./IPlugin.js";

/**
 * Plugin registry interface for managing plugin lifecycle
 */
export type IPluginRegistry = {
  /** Register a plugin instance */
  register(plugin: IPlugin): Effect.Effect<void, Error>;

  /** Unregister a plugin by name */
  unregister(name: string): Effect.Effect<void, Error>;

  /** Get plugin by name */
  getPlugin(name: string): Effect.Effect<IPlugin, Error>;

  /** Get all registered plugins */
  getAllPlugins(): Effect.Effect<IPlugin[], Error>;

  /** Discover plugins in directory */
  discover(directory: string): Effect.Effect<IPlugin[], Error>;

  /** Check if plugin is registered */
  hasPlugin(name: string): Effect.Effect<boolean, Error>;

  /** Get plugins supporting specific protocol */
  getPluginsForProtocol(protocol: string): Effect.Effect<IPlugin[], Error>;
};
