/**
 * Domain Types for Server Configuration
 * Following Domain-Driven Design principles
 */
export enum Protocol {
  KAFKA = "kafka",
  AMQP = "amqp", 
  WEBSOCKET = "websocket",
  HTTP = "http",
  HTTPS = "https",
  WS = "ws",
  WSS = "wss"
}

export type ServerConfig = {
  name: string
  url: string
  protocol: Protocol
  description?: string
  [key: string]: unknown  // Allow extension
}



/**
 * Type guard for TypeSpec object literal configs
 * TypeSpec passes object literals with potentially undefined properties
 */
export function isServerConfigObject(config: unknown): config is Record<string, unknown> {
  return config !== null && typeof config === "object" && !Array.isArray(config)
}

/**
 * Extract string from TypeSpec Scalar or return undefined
 */
export function extractStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  
  // Handle TypeSpec Scalar objects
  if (value && typeof value === "object" && "valueKind" in value) {
    const scalar = value as { value?: string }
    return scalar.value
  }
  
  return undefined
}

/**
 * Validate and extract protocol from config
 */
export function extractProtocol(value: unknown): Protocol | null {
  const protocol = extractStringValue(value)
  if (!protocol) return null
  
  const upperProtocol = protocol.toUpperCase()
  if (upperProtocol in Protocol) {
    return Protocol[upperProtocol as keyof typeof Protocol]
  }
  
  return null
}

/**
 * Type-safe server configuration extraction
 * Replaces all unsafe `any` casting with proper validation
 */
export function extractServerConfig(config: unknown): { success: boolean; config: ServerConfig | null; error?: string } {
  // Type guard
  if (!isServerConfigObject(config)) {
    return { success: false, config: null, error: "Configuration must be an object" }
  }
  
  // Extract required fields with validation
  const name = extractStringValue(config.name) ?? "default"
  const url = extractStringValue(config.url)
  const protocol = extractProtocol(config.protocol)
  const description = extractStringValue(config.description)
  
  // Validate required fields
  if (!url) {
    return { success: false, config: null, error: "URL is required" }
  }
  
  if (!protocol) {
    const availableProtocols = Object.values(Protocol).join(", ")
    return { 
      success: false, 
      config: null, 
      error: `Protocol must be one of: ${availableProtocols}` 
    }
  }
  
  const serverConfig: ServerConfig = {
    name,
    url,
    protocol,
    description
  }
  
  return { success: true, config: serverConfig }
}