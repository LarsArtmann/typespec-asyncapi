/**
 * Basic Plugin System - Restored Infrastructure
 * 
 * Simplified plugin architecture to enable extensibility without complex
 * interdependencies that caused the original TypeScript catastrophe.
 */

import { Effect } from "effect"

// Basic plugin interface
export interface Plugin {
  readonly name: string
  readonly version: string
  readonly initialize: () => Effect<void, never>
}

// Simple plugin registry
export class PluginRegistry {
  private plugins = new Map<string, Plugin>()

  register(plugin: Plugin): Effect<void, never> {
    return Effect.sync(() => {
      this.plugins.set(plugin.name, plugin)
    })
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  clear(): Effect<void, never> {
    return Effect.sync(() => {
      this.plugins.clear()
    })
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry()
