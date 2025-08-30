import type { DecoratorContext, Namespace, StringValue, Model } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export type ServerConfig = {
  name: string;
  url: string;
  protocol: string;
  description?: string | undefined;
}

export function $server(
  context: DecoratorContext,
  target: Namespace,
  name: StringValue | string,
  config: Model | Record<string, unknown>
): void {
  console.log(`🌐 PROCESSING @server decorator on target: ${target.name}`);
  console.log(`📍 Server name raw value:`, name);
  console.log(`📍 Server config raw value:`, config);
  console.log(`🏷️  Target type: ${target.kind}`);

  if (target.kind !== "Namespace") {
    reportDiagnostic(context.program, {
      code: "invalid-channel-path",
      target: target,
      format: { path: "@server can only be applied to namespaces" },
    });
    return;
  }

  // Extract server name from TypeSpec value with proper type handling
  let serverName: string;
  if (typeof name === "string") {
    serverName = name;
  } else if (name && typeof name === "object" && "value" in name && name.value !== undefined) {
    serverName = String(name.value);
  } else if (name && typeof name === "object" && "valueKind" in name && (name).valueKind === "StringValue") {
    const stringValue = name;
    serverName = String(stringValue.value);
  } else {
    console.log(`⚠️  Could not extract string from server name:`, name);
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
      format: { path: "Server name is required" },
    });
    return;
  }

  // Extract server configuration from TypeSpec Record/Object
  let serverConfig: Partial<ServerConfig>;
  if (config && typeof config === "object" && "properties" in config) {
    serverConfig = extractServerConfigFromObject(config);
  } else {
    console.log(`⚠️  Could not extract config from server config:`, config);
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
      format: { path: "Server configuration is required" },
    });
    return;
  }

  // Validate required server configuration fields
  if (!serverConfig.url) {
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
      format: { path: "Server URL is required" },
    });
    return;
  }

  if (!serverConfig.protocol) {
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
      format: { path: "Server protocol is required" },
    });
    return;
  }

  // Validate protocol
  const supportedProtocols = ["kafka", "amqp", "websocket", "http", "https", "ws", "wss"];
  if (!supportedProtocols.includes(serverConfig.protocol.toLowerCase())) {
    reportDiagnostic(context.program, {
      code: "unsupported-protocol",
      target: target,
      format: { protocol: serverConfig.protocol },
    });
    return;
  }

  // Create complete server configuration
  const completeConfig: ServerConfig = {
    name: serverName,
    url: serverConfig.url,
    protocol: serverConfig.protocol.toLowerCase(),
    description: serverConfig.description || undefined,
  };

  console.log(`📍 Extracted server config:`, completeConfig);

  // Store server configuration in program state
  const serverConfigsMap = context.program.stateMap(stateKeys.serverConfigs);
  const existingConfigs = serverConfigsMap.get(target) || new Map<string, ServerConfig>();
  existingConfigs.set(serverName, completeConfig);
  serverConfigsMap.set(target, existingConfigs);

  console.log(`✅ Successfully stored server config for ${target.name}: ${serverName}`);
  console.log(`📊 Total server configs: ${existingConfigs.size}`);
}

function extractServerConfigFromObject(obj: Model | Record<string, unknown>): Partial<ServerConfig> {
  const config: Partial<ServerConfig> = {};
  
  if ("properties" in obj && obj.properties && typeof obj.properties === "object" && "entries" in obj.properties) {
    // Handle Model type with RekeyableMap
    const modelObj = obj as Model;
    modelObj.properties.forEach((modelProperty, key) => {
      const keyStr = key;
      let valueStr: string | undefined;
      
      // Extract value from ModelProperty.type or ModelProperty.defaultValue
      const propertyValue = modelProperty.defaultValue;
      if (propertyValue && typeof propertyValue === "object" && "valueKind" in propertyValue && (propertyValue as StringValue).valueKind === "StringValue") {
        const stringValue = propertyValue as StringValue;
        valueStr = String(stringValue.value);
      }
      
      if (valueStr) {
        switch (keyStr) {
          case "url":
            config.url = valueStr;
            break;
          case "protocol":
            config.protocol = valueStr;
            break;
          case "description":
            config.description = valueStr;
            break;
        }
      }
    });
  } else if (obj && typeof obj === "object" && !("properties" in obj)) {
    // Handle Record<string, unknown> type
    const recordObj = obj;
    for (const [key, value] of Object.entries(recordObj)) {
      let valueStr: string | undefined;
      
      if (typeof value === "string") {
        valueStr = value;
      } else if (value && typeof value === "object" && "value" in value && value.value !== undefined) {
        valueStr = String((value as StringValue).value);
      } else if (value && typeof value === "object" && "valueKind" in value && (value as StringValue).valueKind === "StringValue") {
        const stringValue = value as StringValue;
        valueStr = String(stringValue.value);
      }
      
      if (valueStr) {
        switch (key) {
          case "url":
            config.url = valueStr;
            break;
          case "protocol":
            config.protocol = valueStr;
            break;
          case "description":
            config.description = valueStr;
            break;
        }
      }
    }
  }
  
  return config;
}