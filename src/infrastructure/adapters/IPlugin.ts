/**
 * M031: Unified Plugin Base Interface
 *
 * This is the foundation of the standardized plugin system that replaces
 * the current plugin chaos with a unified, extensible architecture.
 *
 * Key Design Principles:
 * - Lifecycle Management: initialize → configure → process → dispose
 * - Error Isolation: Plugin failures don't crash the system
 * - Third-Party Ready: External developers can create plugins
 * - Hot Reload: Add/remove plugins without restart
 * - Protocol Agnostic: Works with all AsyncAPI protocols
 */

import type { Effect } from "effect";
import type { DecoratorContext, Model, Operation } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import type { IPluginCapabilities } from "./IPluginCapabilities.js";
import type { IPluginResult } from "./IPluginResult.js";
import type { IPluginContext } from "./IPluginContext.js";

/**
 * UNIFIED PLUGIN INTERFACE - The Foundation of Plugin Ecosystem
 *
 * All plugins (built-in and third-party) implement this interface.
 * Provides standardized lifecycle, error handling, and capabilities.
 */
export type IPlugin = {
  /** Plugin unique identifier (used for registration) */
  readonly name: string;

  /** Plugin semantic version */
  readonly version: string;

  /** Plugin description for documentation */
  readonly description: string;

  /** Plugin author/organization */
  readonly author?: string;

  /** Plugin capabilities and supported features */
  readonly capabilities: IPluginCapabilities;

  /**
   * LIFECYCLE: Initialize plugin with system context
   * Called once when plugin is loaded into registry
   *
   * @param context Plugin initialization context
   * @returns Effect succeeding on successful initialization
   */
  initialize(context: IPluginContext): Effect.Effect<void, Error>;

  /**
   * LIFECYCLE: Configure plugin for specific usage
   * Called before each processing session
   *
   * @param config User-provided configuration
   * @returns Effect succeeding with validated configuration
   */
  configure(
    config: Record<string, unknown>,
  ): Effect.Effect<Record<string, unknown>, Error>;

  /**
   * CORE: Process TypeSpec target and generate protocol bindings
   * This is where the plugin does its main work
   *
   * @param context TypeSpec decorator context
   * @param target Operation or Model being processed
   * @param asyncApiDoc Current AsyncAPI document state
   * @returns Effect producing plugin results
   */
  processBinding(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject,
  ): Effect.Effect<IPluginResult, Error>;

  /**
   * VALIDATION: Validate plugin-specific configuration
   * Used for early error detection and user feedback
   *
   * @param config Configuration to validate
   * @returns Effect succeeding if configuration is valid
   */
  validateConfiguration(
    config: Record<string, unknown>,
  ): Effect.Effect<boolean, Error>;

  /**
   * LIFECYCLE: Dispose plugin and clean up resources
   * Called when plugin is unloaded or system shuts down
   *
   * @returns Effect succeeding on successful cleanup
   */
  dispose(): Effect.Effect<void, Error>;

  /**
   * INTROSPECTION: Get plugin health and status information
   * Used for monitoring and debugging
   *
   * @returns Plugin health status
   */
  getHealthStatus(): Effect.Effect<
    {
      readonly healthy: boolean;
      readonly errors: string[];
      readonly warnings: string[];
      readonly lastProcessedAt?: Date;
      readonly processedCount: number;
    },
    Error
  >;

  /**
   * OPTIONAL: Hot reload support - recreate plugin instance
   * Only implemented by plugins that support hot reloading
   *
   * @param newConfig Updated configuration
   * @returns Effect producing new plugin instance
   */
  reload?(newConfig: Record<string, unknown>): Effect.Effect<IPlugin, Error>;

  /**
   * OPTIONAL: Plugin-specific documentation generation
   * Generate examples, schemas, or other documentation
   *
   * @param target Target being processed
   * @returns Generated documentation
   */
  generateDocumentation?(
    target: Operation | Model,
  ): Effect.Effect<Record<string, unknown>, Error>;
};
