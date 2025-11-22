/**
 * 🏗️ DOMAIN-DRIVEN DESIGN: BOUNDED CONTEXTS
 * 
 * Properly bounded contexts with explicit contracts
 * Strongly typed aggregate roots and value objects
 * Eliminates cross-context pollution and invalid states
 */

import { Effect } from "effect";
import type { AsyncAPIDocument } from "../types/domain/asyncapi-domain-types.js";

// ========================================================================
// CHANNEL CONTEXT
// ========================================================================

/**
 * Channel Aggregate Root
 * 
 * Encapsulates channel behavior and invariants
 * Prevents invalid channel states at compile time
 */
export interface ChannelAggregate {
  readonly id: string;
  readonly path: ChannelPath;
  readonly description: ChannelDescription;
  readonly operations: ReadonlyMap<string, ChannelOperation>;
  readonly parameters: ReadonlyMap<string, ChannelParameter>;
  readonly bindings: ChannelBindings | null;
}

/**
 * Channel Value Objects - Branded types for type safety
 */
export type ChannelPath = string & { readonly _brand: "ChannelPath" };
export type ChannelDescription = string & { readonly _brand: "ChannelDescription" };

export interface ChannelOperation {
  readonly id: string;
  readonly type: OperationType;
  readonly message: MessageReference;
  readonly bindings: OperationBindings | null;
  readonly reply: ReplySchema | null;
}

export type OperationType = "send" | "receive" | "publish" | "subscribe" | "request" | "reply";
export type MessageReference = string & { readonly _brand: "MessageReference" };

export interface ChannelParameter {
  readonly name: string;
  readonly location: "path" | "query" | "header";
  readonly schema: ParameterSchema;
  readonly required: boolean;
}

export type ParameterSchema = string & { readonly _brand: "ParameterSchema" };
export type ChannelBindings = Record<string, unknown> & { readonly _brand: "ChannelBindings" };
export type OperationBindings = Record<string, unknown> & { readonly _brand: "OperationBindings" };
export type ReplySchema = string & { readonly _brand: "ReplySchema" };

// ========================================================================
// MESSAGE CONTEXT
// ========================================================================

/**
 * Message Aggregate Root
 * 
 * Encapsulates message behavior and invariants
 * Prevents invalid message states at compile time
 */
export interface MessageAggregate {
  readonly id: MessageId;
  readonly name: MessageName;
  readonly title: MessageTitle;
  readonly description: MessageDescription;
  readonly payload: PayloadSchema;
  readonly headers: HeaderSchema | null;
  readonly correlationId: CorrelationId | null;
  readonly contentType: ContentType;
}

/**
 * Message Value Objects - Branded types for type safety
 */
export type MessageId = string & { readonly _brand: "MessageId" };
export type MessageName = string & { readonly _brand: "MessageName" };
export type MessageTitle = string & { readonly _brand: "MessageTitle" };
export type MessageDescription = string & { readonly _brand: "MessageDescription" };

export type PayloadSchema = string & { readonly _brand: "PayloadSchema" };
export type HeaderSchema = string & { readonly _brand: "HeaderSchema" };
export type CorrelationId = string & { readonly _brand: "CorrelationId" };
export type ContentType = string & { readonly _brand: "ContentType" };

// ========================================================================
// SERVER CONTEXT
// ========================================================================

/**
 * Server Aggregate Root
 * 
 * Encapsulates server behavior and invariants
 * Prevents invalid server states at compile time
 */
export interface ServerAggregate {
  readonly id: ServerId;
  readonly url: ServerUrl;
  readonly protocol: ServerProtocol;
  readonly description: ServerDescription;
  readonly variables: ReadonlyMap<string, ServerVariable>;
  readonly security: SecurityScheme | null;
  readonly bindings: ServerBindings | null;
}

/**
 * Server Value Objects - Branded types for type safety
 */
export type ServerId = string & { readonly _brand: "ServerId" };
export type ServerUrl = string & { readonly _brand: "ServerUrl" };
export type ServerProtocol = "http" | "https" | "kafka" | "mqtt" | "ws" | "wss" | "amqp" | "redis" | "stomp" | "nats";
export type ServerDescription = string & { readonly _brand: "ServerDescription" };

export interface ServerVariable {
  readonly name: string;
  readonly defaultValue: string | null;
  readonly description: string;
  readonly enum: readonly string[] | null;
}

export type SecurityScheme = Record<string, unknown> & { readonly _brand: "SecurityScheme" };
export type ServerBindings = Record<string, unknown> & { readonly _brand: "ServerBindings" };

// ========================================================================
// SCHEMA CONTEXT
// ========================================================================

/**
 * Schema Aggregate Root
 * 
 * Encapsulates schema behavior and invariants
 * Prevents invalid schema states at compile time
 */
export interface SchemaAggregate {
  readonly id: SchemaId;
  readonly name: SchemaName;
  readonly type: SchemaType;
  readonly properties: ReadonlyMap<string, SchemaProperty>;
  readonly required: readonly string[];
  readonly additionalProperties: boolean | SchemaReference;
  readonly enum: readonly unknown[] | null;
}

/**
 * Schema Value Objects - Branded types for type safety
 */
export type SchemaId = string & { readonly _brand: "SchemaId" };
export type SchemaName = string & { readonly _brand: "SchemaName" };

export type SchemaType = 
  | "object"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "null";

export interface SchemaProperty {
  readonly name: string;
  readonly type: SchemaType;
  readonly description: string;
  readonly required: boolean;
  readonly format: string | null;
  readonly enum: readonly unknown[] | null;
  readonly items: SchemaReference | null;
}

export type SchemaReference = string & { readonly _brand: "SchemaReference" };

// ========================================================================
// DOMAIN SERVICES
// ========================================================================

/**
 * Channel Domain Service
 * 
 * Encapsulates channel business logic
 * Maintains channel invariants and cross-channel rules
 */
export class ChannelDomainService {
  /**
   * Validate channel path according to AsyncAPI specification
   */
  validateChannelPath(path: string): Effect.Effect<ChannelPath, DomainError> {
    return Effect.gen(function*() {
      // Must start with /
      if (!path.startsWith("/")) {
        return yield* Effect.fail(new DomainError(
          "invalid-channel-path",
          "Channel path must start with '/'",
          { path }
        ));
      }

      // Cannot end with /
      if (path.length > 1 && path.endsWith("/")) {
        return yield* Effect.fail(new DomainError(
          "invalid-channel-path",
          "Channel path cannot end with '/'",
          { path }
        ));
      }

      // Validate parameter syntax
      const parameterRegex = /\{[^}]+\}/g;
      const parameters = path.match(parameterRegex);
      
      if (parameters) {
        for (const param of parameters) {
          if (param.length < 3 || param.length > 50) {
            return yield* Effect.fail(new DomainError(
              "invalid-parameter-name",
              "Channel parameter name must be between 1 and 47 characters",
              { parameter: param }
            ));
          }
        }
      }

      return path as ChannelPath;
    });
  }

  /**
   * Extract parameters from channel path
   */
  extractChannelParameters(path: ChannelPath): readonly string[] {
    const parameterRegex = /\{([^}]+)\}/g;
    const parameters: string[] = [];
    let match;
    
    while ((match = parameterRegex.exec(path)) !== null) {
      parameters.push(match[1]);
    }
    
    return parameters;
  }
}

/**
 * Message Domain Service
 * 
 * Encapsulates message business logic
 * Maintains message invariants and cross-message rules
 */
export class MessageDomainService {
  /**
   * Validate message reference
   */
  validateMessageReference(ref: string): Effect.Effect<MessageReference, DomainError> {
    return Effect.gen(function*() {
      // Must be non-empty
      if (!ref || ref.trim().length === 0) {
        return yield* Effect.fail(new DomainError(
          "invalid-message-reference",
          "Message reference cannot be empty",
          { reference: ref }
        ));
      }

      // Must follow pattern
      if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(ref)) {
        return yield* Effect.fail(new DomainError(
          "invalid-message-reference",
          "Message reference must start with letter and contain only alphanumeric, dot, dash, underscore",
          { reference: ref }
        ));
      }

      return ref as MessageReference;
    });
  }

  /**
   * Extract correlation ID from message schema
   */
  extractCorrelationId(schema: Record<string, unknown>): CorrelationId | null {
    const correlationId = schema["x-correlation-id"] || schema["correlationId"];
    
    if (typeof correlationId === "string" && correlationId.length > 0) {
      return correlationId as CorrelationId;
    }
    
    return null;
  }
}

/**
 * Server Domain Service
 * 
 * Encapsulates server business logic
 * Maintains server invariants and protocol-specific rules
 */
export class ServerDomainService {
  /**
   * Validate server URL for specific protocol
   */
  validateServerUrl(url: string, protocol: ServerProtocol): Effect.Effect<ServerUrl, DomainError> {
    return Effect.gen(function*() {
      // Must be non-empty
      if (!url || url.trim().length === 0) {
        return yield* Effect.fail(new DomainError(
          "invalid-server-url",
          "Server URL cannot be empty",
          { url, protocol }
        ));
      }

      // Protocol-specific validation
      if (protocol === "http" || protocol === "https") {
        try {
          new URL(url); // Validates URL format
        } catch {
          return yield* Effect.fail(new DomainError(
            "invalid-server-url",
            "Invalid URL format for HTTP/HTTPS server",
            { url, protocol }
          ));
        }
      }

      if (protocol === "kafka") {
        // Should be comma-separated bootstrap servers
        const servers = url.split(",");
        if (servers.length === 0) {
          return yield* Effect.fail(new DomainError(
            "invalid-server-url",
            "Kafka URL must contain at least one bootstrap server",
            { url, protocol }
          ));
        }
      }

      return url as ServerUrl;
    });
  }
}

// ========================================================================
// DOMAIN ERRORS
// ========================================================================

/**
 * Domain Error with structured context
 * 
 * Properly typed domain errors for business logic
 * Eliminates string-based error handling
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(code: string, message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context
    };
  }
}

// ========================================================================
// VALUE OBJECT FACTORIES
// ========================================================================

/**
 * Type-safe value object creators with validation
 */
export const ValueObjects = {
  createChannelPath: (path: string): Effect.Effect<ChannelPath, DomainError> =>
    new ChannelDomainService().validateChannelPath(path),

  createMessageReference: (ref: string): Effect.Effect<MessageReference, DomainError> =>
    new MessageDomainService().validateMessageReference(ref),

  createServerUrl: (url: string, protocol: ServerProtocol): Effect.Effect<ServerUrl, DomainError> =>
    new ServerDomainService().validateServerUrl(url, protocol)
};