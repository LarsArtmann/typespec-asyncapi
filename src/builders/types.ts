/**
 * Shared types for the document builder pipeline.
 */

import type { Program, Type } from "@typespec/compiler";
import type {
  ChannelObject,
  MessageObject,
  OperationAction,
  OperationObject,
  JsonSchema,
  SecurityScheme,
  ServerObject,
} from "../domain/models/asyncapi-document.js";

/** A discovered operation from decorator state or bare namespace scanning. */
export interface DiscoveredOp {
  action: OperationAction;
  channelKey: string;
  messageNames: string[];
  messageSchemaNames: string[];
  opName: string;
}

/** Mutable accumulator maps shared across all builder functions. */
export interface DocumentBuildContext {
  channels: Record<string, ChannelObject>;
  operations: Record<string, OperationObject>;
  messages: Record<string, MessageObject>;
  servers: Record<string, ServerObject>;
  securitySchemes: Record<string, SecurityScheme>;
  schemas: Record<string, JsonSchema>;
  discoveredOps: DiscoveredOp[];
  opToChannel: Map<string, string>;
  channelDocs: Map<string, string>;
  opDocs: Map<string, string>;
  program: Program;
}

/** Extract the name from a TypeSpec Type, if it has one. */
export function nameOfType(type: Type): string | undefined {
  if ("name" in type && typeof type.name === "string") {
    return type.name;
  }
  return undefined;
}
