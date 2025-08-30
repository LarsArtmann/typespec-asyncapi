import type { DecoratorContext, Model, Operation } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect" | "sasl" | "x509" | "symmetricEncryption" | "asymmetricEncryption";

export interface ApiKeySecurityScheme {
  type: "apiKey";
  /** Location of the API key */
  in: "user" | "password" | "query" | "header" | "cookie";
  /** Description of the security scheme */
  description?: string;
}

export interface HttpSecurityScheme {
  type: "http";
  /** HTTP authentication scheme */
  scheme: "basic" | "bearer" | "digest" | "hoba" | "mutual" | "negotiate" | "oauth" | "scram-sha-1" | "scram-sha-256" | "vapid";
  /** Bearer format (for bearer scheme) */
  bearerFormat?: string;
  /** Description of the security scheme */
  description?: string;
}

export interface OAuth2SecurityScheme {
  type: "oauth2";
  /** OAuth 2.0 flows */
  flows: {
    implicit?: {
      authorizationUrl: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
  };
  /** Description of the security scheme */
  description?: string;
}

export interface OpenIdConnectSecurityScheme {
  type: "openIdConnect";
  /** OpenID Connect URL */
  openIdConnectUrl: string;
  /** Description of the security scheme */
  description?: string;
}

export interface SaslSecurityScheme {
  type: "sasl";
  /** SASL mechanism */
  mechanism: "PLAIN" | "SCRAM-SHA-256" | "SCRAM-SHA-512" | "GSSAPI";
  /** Description of the security scheme */
  description?: string;
}

export interface X509SecurityScheme {
  type: "x509";
  /** Description of the security scheme */
  description?: string;
}

export interface SymmetricEncryptionSecurityScheme {
  type: "symmetricEncryption";
  /** Description of the security scheme */
  description?: string;
}

export interface AsymmetricEncryptionSecurityScheme {
  type: "asymmetricEncryption";
  /** Description of the security scheme */
  description?: string;
}

export type SecurityScheme = 
  | ApiKeySecurityScheme 
  | HttpSecurityScheme 
  | OAuth2SecurityScheme 
  | OpenIdConnectSecurityScheme 
  | SaslSecurityScheme 
  | X509SecurityScheme 
  | SymmetricEncryptionSecurityScheme 
  | AsymmetricEncryptionSecurityScheme;

export interface SecurityConfig {
  /** Security scheme name */
  name: string;
  /** Security scheme configuration */
  scheme: SecurityScheme;
  /** Required scopes (for OAuth2 and OpenID Connect) */
  scopes?: string[];
  /** Additional security metadata */
  metadata?: Record<string, unknown>;
}

/**
 * @security decorator for defining AsyncAPI security schemes
 * 
 * Applies security scheme information to operations, channels, or servers.
 * Supports API key, HTTP auth, OAuth 2.0, OpenID Connect, SASL, X.509, and encryption schemes.
 * 
 * @example
 * ```typespec
 * @security({
 *   name: "kafkaAuth",
 *   scheme: {
 *     type: "sasl",
 *     mechanism: "SCRAM-SHA-256"
 *   }
 * })
 * @server("kafka-server", "kafka://localhost:9092", "kafka")
 * namespace MyKafkaAPI;
 * 
 * @security({
 *   name: "bearerAuth", 
 *   scheme: {
 *     type: "http",
 *     scheme: "bearer",
 *     bearerFormat: "JWT"
 *   }
 * })
 * @channel("user.events")
 * @publish
 * op publishUserEvent(@message event: UserEvent): void;
 * ```
 */
export function $security(
  context: DecoratorContext, 
  target: Operation | Model, 
  config: SecurityConfig
): void {
  console.log(`= PROCESSING @security decorator on: ${target.kind} ${target.name || 'unnamed'}`);
  console.log(`=� Security config:`, config);
  console.log(`<�  Target type: ${target.kind}`);
  
  if (target.kind !== "Operation" && target.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "invalid-security-target",
      target: target,
      format: { targetType: (target as any).kind || 'unknown' },
    });
    return;
  }

  // Validate security configuration
  if (!config || !config.name || !config.scheme) {
    reportDiagnostic(context.program, {
      code: "missing-security-config",
      target: target,
    });
    return;
  }

  // Validate security scheme
  const validationResult = validateSecurityScheme(config.scheme);
  if (!validationResult.valid) {
    reportDiagnostic(context.program, {
      code: "invalid-security-scheme",
      target: target,
      format: { scheme: validationResult.errors.join(", ") },
    });
    return;
  }

  if (validationResult.warnings.length > 0) {
    console.log(`�  Security scheme validation warnings:`, validationResult.warnings);
    validationResult.warnings.forEach(warning => {
      console.log(`�  ${warning}`);
    });
  }

  console.log(`=� Validated security config for ${config.name}:`, config);

  // Store security configuration in program state
  const securityMap = context.program.stateMap(stateKeys.securityConfigs);
  securityMap.set(target, config);
  
  console.log(` Successfully stored security config for ${target.kind} ${target.name || 'unnamed'}`);
  console.log(`=� Total entities with security config: ${securityMap.size}`);
}

/**
 * Validate security scheme configuration
 */
function validateSecurityScheme(scheme: SecurityScheme): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  switch (scheme.type) {
    case "apiKey":
      const apiKeyScheme = scheme as ApiKeySecurityScheme;
      const validApiKeyLocations = ["user", "password", "query", "header", "cookie"];
      if (!validApiKeyLocations.includes(apiKeyScheme.in)) {
        errors.push(`Invalid API key location: ${apiKeyScheme.in}. Must be one of: ${validApiKeyLocations.join(", ")}`);
      }
      break;
      
    case "http":
      const httpScheme = scheme as HttpSecurityScheme;
      const validHttpSchemes = ["basic", "bearer", "digest", "hoba", "mutual", "negotiate", "oauth", "scram-sha-1", "scram-sha-256", "vapid"];
      if (!validHttpSchemes.includes(httpScheme.scheme)) {
        errors.push(`Invalid HTTP scheme: ${httpScheme.scheme}. Must be one of: ${validHttpSchemes.join(", ")}`);
      }
      if (httpScheme.scheme === "bearer" && !httpScheme.bearerFormat) {
        warnings.push("Bearer scheme should specify bearerFormat for clarity");
      }
      break;
      
    case "oauth2":
      const oauth2Scheme = scheme as OAuth2SecurityScheme;
      const flows = oauth2Scheme.flows;
      if (!flows || Object.keys(flows).length === 0) {
        errors.push("OAuth2 scheme must define at least one flow");
      }
      
      // Validate each flow
      Object.entries(flows).forEach(([flowType, flow]) => {
        if (flow) {
          if (flowType === "implicit" || flowType === "authorizationCode") {
            if (!(flow as any).authorizationUrl) {
              errors.push(`${flowType} flow must have authorizationUrl`);
            }
          }
          if (flowType === "password" || flowType === "clientCredentials" || flowType === "authorizationCode") {
            if (!(flow as any).tokenUrl) {
              errors.push(`${flowType} flow must have tokenUrl`);
            }
          }
          if (!flow.scopes || Object.keys(flow.scopes).length === 0) {
            warnings.push(`${flowType} flow should define scopes`);
          }
        }
      });
      break;
      
    case "openIdConnect":
      const oidcScheme = scheme as OpenIdConnectSecurityScheme;
      if (!oidcScheme.openIdConnectUrl) {
        errors.push("OpenID Connect scheme must have openIdConnectUrl");
      }
      try {
        new URL(oidcScheme.openIdConnectUrl);
      } catch {
        errors.push("OpenID Connect URL must be a valid URL");
      }
      break;
      
    case "sasl":
      const saslScheme = scheme as SaslSecurityScheme;
      const validSaslMechanisms = ["PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512", "GSSAPI"];
      if (!validSaslMechanisms.includes(saslScheme.mechanism)) {
        errors.push(`Invalid SASL mechanism: ${saslScheme.mechanism}. Must be one of: ${validSaslMechanisms.join(", ")}`);
      }
      break;
      
    case "x509":
    case "symmetricEncryption":
    case "asymmetricEncryption":
      // These schemes don't require additional validation beyond type
      break;
      
    default:
      errors.push(`Unknown security scheme type: ${(scheme as any).type}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get security configuration for a target
 */
export function getSecurityConfig(context: DecoratorContext, target: Operation | Model): SecurityConfig | undefined {
  const securityMap = context.program.stateMap(stateKeys.securityConfigs);
  return securityMap.get(target);
}

/**
 * Check if a target has security configuration
 */
export function hasSecurityConfig(context: DecoratorContext, target: Operation | Model): boolean {
  const securityMap = context.program.stateMap(stateKeys.securityConfigs);
  return securityMap.has(target);
}

/**
 * Get all security configurations in the program
 */
export function getAllSecurityConfigs(context: DecoratorContext): Map<Operation | Model, SecurityConfig> {
  return context.program.stateMap(stateKeys.securityConfigs) as Map<Operation | Model, SecurityConfig>;
}

/**
 * Common security schemes for quick setup
 */
export const CommonSecuritySchemes = {
  /** JWT Bearer token authentication */
  jwtBearer: {
    name: "bearerAuth",
    scheme: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  },
  
  /** Basic HTTP authentication */
  basicAuth: {
    name: "basicAuth", 
    scheme: {
      type: "http" as const,
      scheme: "basic"
    }
  },
  
  /** API key in header */
  apiKeyHeader: {
    name: "apiKeyAuth",
    scheme: {
      type: "apiKey" as const,
      in: "header" as const
    }
  },
  
  /** Kafka SASL authentication */
  kafkaSasl: {
    name: "kafkaAuth",
    scheme: {
      type: "sasl" as const,
      mechanism: "SCRAM-SHA-256" as const
    }
  },
  
  /** OAuth 2.0 client credentials flow */
  oauth2ClientCredentials: {
    name: "oauth2Auth",
    scheme: {
      type: "oauth2" as const,
      flows: {
        clientCredentials: {
          tokenUrl: "https://example.com/oauth/token",
          scopes: {}
        }
      }
    }
  }
} as const;