import { test, expect } from "bun:test";
import { PluginRegistry, Plugin } from "../../src/plugins/core/PluginSystem.js";

test("Basic Plugin System - Registration and Retrieval", () => {
  const registry = new PluginRegistry();

  // Test plugin interface
  const testPlugin: Plugin = {
    name: "test-plugin",
    version: "1.0.0",
    initialize: () => Promise.resolve(),
  };

  // Test registration
  registry.register(testPlugin);

  // Test retrieval
  const retrieved = registry.get("test-plugin");
  expect(retrieved).toBe(testPlugin);

  // Test getAll
  const all = registry.getAll();
  expect(all).toHaveLength(1);
  expect(all[0]).toBe(testPlugin);
});
