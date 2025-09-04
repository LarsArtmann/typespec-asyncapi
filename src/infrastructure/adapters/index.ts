// Infrastructure Adapters - External System Adapters
// Plugin system and external service adapters

export * from "../../infrastructure/adapters/PluginRegistry.js";
export * from './PluginError.js';
export type * from './IPlugin.js';
export type * from './IPluginCapabilities.js';
export type * from './IPluginContext.js';
export type * from './IPluginRegistry.js';
export type * from './IPluginResult.js';

// Plugin system implementation
export * from './plugin-system.js';
export * from './simple-plugin-registry.js';
export type * from './protocol-plugin.js';

// Built-in plugins
export * from './enhanced-amqp-plugin.js';
export * from './enhanced-mqtt-plugin.js';
export * from './enhanced-websocket-plugin.js';
export * from './http-plugin.js';
export * from './kafka-plugin.js';
export * from './websocket-plugin.js';

// Plugin configuration errors
export * from './PluginConfigurationError.js';
export * from './PluginExecutionError.js';
export * from './PluginLoadingError.js';