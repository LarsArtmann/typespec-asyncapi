/**
 * Shared TypeSpec state and operation utilities
 * Extracted from duplicated operation discovery and state access logic
 */

import type { Program, Operation, Namespace } from "@typespec/compiler";
import { $lib } from "../lib.js";

/**
 * Discover all operations from TypeSpec program
 * Extracted from asyncapi-emitter.ts and emitter-with-effect.ts
 */
export function discoverOperations(program: Program): Operation[] {
  const operations: Operation[] = [];
  walkNamespace(program.getGlobalNamespaceType(), operations, program);
  return operations;
}

/**
 * Walk namespace hierarchy to find operations
 * Centralized namespace traversal logic
 */
export function walkNamespace(ns: Namespace, operations: Operation[], program: Program): void {
  // Collect operations from current namespace
  ns.operations.forEach((operation, name) => {
    operations.push(operation);
    console.log(`🔍 FOUND OPERATION: ${name} (kind: ${operation.kind})`);
  });
  
  // Recursively walk child namespaces
  ns.namespaces.forEach((childNs) => {
    walkNamespace(childNs, operations, program);
  });
}

/**
 * Get operation type from TypeSpec decorator state
 * Extracted common logic for @publish/@subscribe detection
 */
export function getOperationType(operation: Operation, program: Program): string | undefined {
  const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes);
  return operationTypesMap.get(operation) as string | undefined;
}

/**
 * Get channel path from TypeSpec decorator state
 * Extracted common logic for @channel path detection
 */
export function getChannelPath(operation: Operation, program: Program): string | undefined {
  const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths);
  return channelPathsMap.get(operation) as string | undefined;
}

/**
 * Determine AsyncAPI action from operation type
 * Centralized action mapping logic
 */
export function getAsyncAPIAction(operationType: string | undefined): "send" | "receive" {
  return operationType === "subscribe" ? "receive" : "send";
}

/**
 * Sanitize channel path to create valid AsyncAPI channel identifier
 * Extracted from integration-example.ts
 */
export function sanitizeChannelId(channelPath: string): string {
  return channelPath
    .replace(/^\//, '') // Remove leading slash
    .replace(/\//g, '_') // Replace slashes with underscores
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * Log detailed operation information
 * Centralized operation logging from multiple files
 */
export function logOperationDetails(operation: Operation, program: Program): void {
  console.log(`  - Return type: ${operation.returnType.kind}`);
  console.log(`  - Parameters: ${operation.parameters.properties.size}`);
  
  const operationType = getOperationType(operation, program);
  const channelPath = getChannelPath(operation, program);
  
  if (operationType) {
    console.log(`  - Operation type: ${operationType}`);
  }
  
  if (channelPath) {
    console.log(`  - Channel path: ${channelPath}`);
  }
  
  operation.parameters.properties.forEach((param, paramName) => {
    console.log(`  - Parameter: ${paramName} (${param.type.kind})`);
  });
}
