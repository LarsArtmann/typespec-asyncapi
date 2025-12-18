/**
 * 🎯 ASYNCAPI DOMAIN TYPES: Minimal Working Types
 *
 * Simple domain types to resolve import errors and get tests working
 */

// ===== BASIC TYPE DEFINITIONS =====

/**
 * Basic AsyncAPI channel type
 */
export interface Channel {
  path: string;
  description?: string;
}

/**
 * Basic AsyncAPI message type
 */
export interface Message {
  id: string;
  schemaName: string;
  description?: string;
}

/**
 * Basic AsyncAPI operation type
 */
export interface Operation {
  id: string;
  type: "send" | "receive";
  description?: string;
}

/**
 * Basic AsyncAPI server type
 */
export interface Server {
  url: string;
  protocol: "kafka" | "mqtt" | "amqp" | "ws" | "http" | "https";
  description?: string;
}

/**
 * Basic AsyncAPI specification type
 */
export interface AsyncAPISpec {
  asyncapi: "3.0.0";
  info: {
    title: string;
    version: string;
    description?: string;
  };
}

// ===== TYPE COLLECTIONS =====

export type AsyncAPIChannels = Record<string, Channel>;
export type AsyncAPIMessages = Record<string, Message>;
export type AsyncAPIOperations = Record<string, Operation>;
export type AsyncAPIServers = Record<string, Server>;
export type AsyncAPISchemas = Record<string, unknown>;

// ===== VALIDATION ERROR CLASS =====

export class AsyncAPIValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
  ) {
    super(message);
    this.name = "AsyncAPIValidationError";
  }
}

// ===== SIMPLE CONSTRUCTORS =====

/**
 * Create a basic channel
 */
export const createChannel = (input: unknown): Channel => {
  return input as Channel;
};

/**
 * Create a basic message
 */
export const createMessage = (input: unknown): Message => {
  return input as Message;
};

/**
 * Create a basic operation
 */
export const createOperation = (input: unknown): Operation => {
  return input as Operation;
};

/**
 * Create a basic server
 */
export const createServer = (input: unknown): Server => {
  return input as Server;
};

/**
 * Create a basic AsyncAPI specification
 */
export const createAsyncAPISpec = (input: unknown): AsyncAPISpec => {
  return input as AsyncAPISpec;
};

// ===== COLLECTION CONSTRUCTORS =====

/**
 * Create basic channels collection
 */
export const createAsyncAPIChannels = (input: unknown): AsyncAPIChannels => {
  return input as AsyncAPIChannels;
};

/**
 * Create basic messages collection
 */
export const createAsyncAPIMessages = (input: unknown): AsyncAPIMessages => {
  return input as AsyncAPIMessages;
};

/**
 * Create basic operations collection
 */
export const createAsyncAPIOperations = (input: unknown): AsyncAPIOperations => {
  return input as AsyncAPIOperations;
};

/**
 * Create basic servers collection
 */
export const createAsyncAPIServers = (input: unknown): AsyncAPIServers => {
  return input as AsyncAPIServers;
};

/**
 * Create basic schemas collection
 */
export const createAsyncAPISchemas = (input: unknown): AsyncAPISchemas => {
  return input as AsyncAPISchemas;
};

// ===== UTILITY FUNCTIONS =====

export const channelPathToString = (channelPath: string): string => {
  return channelPath;
};

export const messageIdToString = (messageId: string): string => {
  return messageId;
};

export const schemaNameToString = (schemaName: string): string => {
  return schemaName;
};

export const operationIdToString = (operationId: string): string => {
  return operationId;
};

export const serverUrlToString = (serverUrl: string): string => {
  return serverUrl;
};

// ===== TYPE GUARDS =====

export const isChannel = (value: unknown): value is Channel => {
  return typeof value === "object" && value !== null && "path" in value;
};

export const isMessage = (value: unknown): value is Message => {
  return typeof value === "object" && value !== null && "id" in value && "schemaName" in value;
};

export const isOperation = (value: unknown): value is Operation => {
  return typeof value === "object" && value !== null && "id" in value && "type" in value;
};

export const isServer = (value: unknown): value is Server => {
  return typeof value === "object" && value !== null && "url" in value && "protocol" in value;
};

export const isAsyncAPISpec = (value: unknown): value is AsyncAPISpec => {
  return typeof value === "object" && value !== null && "asyncapi" in value;
};