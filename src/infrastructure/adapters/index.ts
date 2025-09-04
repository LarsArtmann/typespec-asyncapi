// Infrastructure Adapters - External System Adapters
// Plugin system and external service adapters

export * from "../../infrastructure/adapters/PluginRegistry.js";
export * from './PluginError.js';
export * from './IPlugin.js';
export * from './IPluginCapabilities.js';
export * from './IPluginContext.js';
export * from './IPluginRegistry.js';
export * from './IPluginResult.js';

// Plugin system implementation
export * from './plugin-system.js';
export * from './simple-plugin-registry.js';
export * from './protocol-plugin.js';

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