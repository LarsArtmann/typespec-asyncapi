import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

/**
 * Enhanced TypeSpec library with comprehensive error handling
 * Following What/Reassure/Why/Fix/Escape messaging pattern
 */
export const $libEnhanced = createTypeSpecLibrary({
  name: "@typespec/asyncapi-enhanced",
  diagnostics: {
    // ==========================================
    // COMPREHENSIVE ERROR HANDLING DIAGNOSTICS
    // Following What/Reassure/Why/Fix/Escape pattern
    // ==========================================
    
    "comprehensive-error": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Error ${"errorId"}: ${"what"}\n💡 ${"reassure"}\n🔍 Root Cause: ${"why"}\n🔧 Solutions:\n  • ${"fix"}\n🚪 Workaround: ${"escape"}`,
      },
    },
    
    "validation-error-with-recovery": {
      severity: "warning",
      messages: {
        default: paramMessage`⚠️ Validation Error: ${"what"}\n💡 This can be automatically recovered\n🔧 Using default value: ${"recoveryValue"}\n📝 To fix permanently: ${"permanentFix"}`,
      },
    },
    
    "performance-warning": {
      severity: "warning",
      messages: {
        default: paramMessage`⚡ Performance Warning: ${"metric"} exceeded threshold\n📊 Current: ${"actual"} | Threshold: ${"threshold"}\n🔧 Consider: ${"suggestion"}\n🚪 Continuing with degraded performance`,
      },
    },
    
    "file-system-error-recovered": {
      severity: "warning",
      messages: {
        default: paramMessage`💾 File System Error: ${"what"}\n🔄 Recovered using fallback: ${"fallbackPath"}\n🔧 To fix: ${"permanentFix"}`,
      },
    },
    
    "schema-generation-skipped": {
      severity: "warning",
      messages: {
        default: paramMessage`⏭️ Skipping schema for '${"typeName"}'\n🔍 Reason: ${"reason"}\n📄 This type will be documented as unsupported\n🔧 Consider: ${"suggestion"}`,
      },
    },
    
    "operation-recovery-attempted": {
      severity: "warning",
      messages: {
        default: paramMessage`🔄 Recovery Attempted: ${"operation"}\n📊 Strategy: ${"strategy"}\n📈 Result: ${"successful"} ? "Successful" : "Failed"\n📄 Details: ${"details"}`,
      },
    },
    
    // Enhanced original diagnostics with What/Reassure/Why/Fix/Escape pattern
    "invalid-asyncapi-version": {
      severity: "error", 
      messages: {
        default: paramMessage`🚨 AsyncAPI version '${"version"}' is not supported\n💡 This is a configuration issue that can be easily fixed\n🔍 Only AsyncAPI 3.0.0 is currently supported by this emitter\n🔧 Update your emitter options: "asyncapi-version": "3.0.0"\n🚪 The emitter will default to AsyncAPI 3.0.0 and continue`,
      },
    },
    
    "missing-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Operation '${"operationName"}' missing @channel decorator\n💡 AsyncAPI requires all operations to specify their channel path\n🔍 Operations need channel information to generate proper AsyncAPI specification\n🔧 Add @channel("/your-channel-path") decorator to the operation\n🚪 Operation will be skipped in the generated specification`,
      },
    },
    
    "invalid-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Channel path '${"path"}' is not valid\n💡 Channel paths must follow AsyncAPI identifier conventions\n🔍 Path contains invalid characters or format\n🔧 Use format: /topic-name, /service/event-type, or {variable} syntax\n🚪 A sanitized path will be generated automatically`,
      },
    },
    
    "missing-message-schema": {
      severity: "error", 
      messages: {
        default: paramMessage`🚨 Message '${"messageName"}' missing schema definition\n💡 AsyncAPI requires all messages to have defined schemas\n🔍 Message schema is needed for API documentation and validation\n🔧 Define a TypeSpec model for the message payload\n🚪 A generic object schema will be generated with documentation note`,
      },
    },
    
    "conflicting-operation-type": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Operation '${"operationName"}' has conflicting decorators\n💡 Operations can only be either @publish or @subscribe, not both\n🔍 Conflicting decorators create ambiguous AsyncAPI specification\n🔧 Remove one of the conflicting decorators: @publish or @subscribe\n🚪 The operation will be treated as @publish by default`,
      },
    },
    
    "unsupported-protocol": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Protocol '${"protocol"}' is not supported\n💡 AsyncAPI 3.0 has specific protocol requirements\n🔍 This emitter only supports well-defined AsyncAPI protocols\n🔧 Use one of: kafka, amqp, websocket, http, mqtt\n🚪 The protocol will be set to 'websocket' with a compatibility note`,
      },
    },
    
    "missing-server-config": {
      severity: "warning",
      messages: {
        default: paramMessage`⚠️ No server configuration found\n💡 AsyncAPI specifications should include server connection details\n🔍 Servers define where and how to connect to the API\n🔧 Add @server decorator to define connection information\n🚪 A default localhost server will be generated for completeness`,
      },
    },
    
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Server configuration '${"config"}' is not valid\n💡 Server configurations must include essential connection details\n🔍 Missing required fields: url and protocol\n🔧 Provide complete server configuration with url and protocol\n🚪 Invalid server will be replaced with default configuration`,
      },
    },
    
    "duplicate-server-name": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Server name '${"serverName"}' is already defined\n💡 Server names must be unique within a namespace\n🔍 Duplicate names cause confusion in the AsyncAPI specification\n🔧 Choose a unique name for each server configuration\n🚪 Duplicate server will be renamed with suffix`,
      },
    },
    
    "invalid-security-scheme": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Security scheme '${"scheme"}' is not valid for AsyncAPI 3.0\n💡 AsyncAPI 3.0 has specific security scheme requirements\n🔍 The scheme type or configuration doesn't match AsyncAPI standards\n🔧 Use supported schemes: oauth2, apiKey, http, userPassword, X509\n🚪 Invalid scheme will be omitted from the specification`,
      },
    },
    
    "duplicate-channel-id": {
      severity: "error", 
      messages: {
        default: paramMessage`🚨 Channel ID '${"channelId"}' is already defined\n💡 Channel IDs must be unique within an AsyncAPI specification\n🔍 Duplicate IDs cause conflicts in the generated specification\n🔧 Use unique channel identifiers or group related operations\n🚪 Duplicate channel will be renamed with numeric suffix`,
      },
    },
    
    "circular-message-reference": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Circular reference detected in message schema for '${"messageName"}'\n💡 Circular references can be resolved using JSON Schema references\n🔍 The message type references itself directly or indirectly\n🔧 Break the circular dependency or use $ref to handle recursion\n🚪 Circular reference will be resolved using JSON Schema $ref`,
      },
    },
    
    // Additional error patterns for comprehensive coverage
    "memory-threshold-exceeded": {
      severity: "warning",
      messages: {
        default: paramMessage`⚡ Memory usage (${"current"}MB) exceeded threshold (${"threshold"}MB)\n💡 Large schemas can consume significant memory\n🔍 Consider breaking large specifications into smaller modules\n🔧 Enable streaming mode or increase memory limit\n🚪 Processing will continue with memory optimization`,
      },
    },
    
    "timeout-warning": {
      severity: "warning",
      messages: {
        default: paramMessage`⏱️ Operation '${"operation"}' taking longer than expected (${"duration"}ms)\n💡 Complex schemas may require additional processing time\n🔍 Large type hierarchies can slow down schema generation\n🔧 Consider simplifying complex types or increasing timeout\n🚪 Processing will continue with extended timeout`,
      },
    },
    
    "dependency-resolution-failed": {
      severity: "error",
      messages: {
        default: paramMessage`🚨 Failed to resolve dependency: ${"dependency"}\n💡 Missing dependencies can prevent proper compilation\n🔍 The dependency is required for this TypeSpec feature\n🔧 Install missing dependency: bun add ${"dependency"}\n🚪 Feature using this dependency will be disabled`,
      },
    },
  },
  
  state: {
    // Enhanced state management for error handling
    channelPaths: { description: "Map of operation to channel path" },
    messageSchemas: { description: "Map of message names to their schemas" },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    securitySchemes: { description: "Security scheme configurations" },
    operationTypes: { description: "Map of operations to publish/subscribe type" },
    errorContexts: { description: "Error contexts for comprehensive error tracking" },
    recoveryAttempts: { description: "Recovery attempts and their results" },
    performanceMetrics: { description: "Performance monitoring data" },
    fallbackStrategies: { description: "Fallback strategies used during processing" },
  },
} as const);

export const { 
  reportDiagnostic: reportEnhancedDiagnostic, 
  createDiagnostic: createEnhancedDiagnostic, 
  stateKeys: enhancedStateKeys 
} = $libEnhanced;
