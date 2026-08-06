/**
 * Shared types for the document builder pipeline.
 */

import type { Program, Type } from "@typespec/compiler";
import type {
  ChannelObject,
  CorrelationIdObject,
  MessageObject,
  OperationAction,
  OperationObject,
  OperationTraitObject,
  MessageTraitObject,
  JsonSchema,
  ParameterObject,
  ProtocolBindings,
  SecurityScheme,
  ServerObject,
  Tag,
} from "../domain/models/asyncapi-document.js";
import type { AsyncAPIConsolidatedState } from "../state.js";

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
  tags: Record<string, Tag>;
  operationTraits: Record<string, OperationTraitObject>;
  messageTraits: Record<string, MessageTraitObject>;
  reusableParameters: Record<string, ParameterObject>;
  reusableCorrelationIds: Record<string, CorrelationIdObject>;
  operationBindings: Record<string, ProtocolBindings>;
  messageBindings: Record<string, ProtocolBindings>;
  serverBindings: Record<string, ProtocolBindings>;
  discoveredOps: DiscoveredOp[];
  opToChannel: Map<string, string>;
  channelDocs: Map<string, string>;
  channelSummaries: Map<string, string>;
  opDocs: Map<string, string>;
  program: Program;
}

/** Standard signature shared by every document builder function. */
export type BuilderFn = (state: AsyncAPIConsolidatedState, ctx: DocumentBuildContext) => void;

/** Extract the name from a TypeSpec Type, if it has one. */
export function nameOfType(type: Type): string | undefined {
  if ("name" in type && typeof type.name === "string") {
    return type.name;
  }
  return undefined;
}

/** Apply `fn` to the message at `key` if it exists in the context. */
export function withMessage(
  ctx: DocumentBuildContext,
  key: string,
  fn: (msg: MessageObject) => void,
): void {
  const msg = ctx.messages[key];
  if (msg) {
    fn(msg);
  }
}
