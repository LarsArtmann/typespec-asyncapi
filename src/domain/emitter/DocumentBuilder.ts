/**
 * Document Builder Service
 * 
 * Provides functionality to build AsyncAPI documents from TypeSpec programs
 */

import { Effect } from "effect";
import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject, ServerObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import { stateSymbols } from "../../lib.js";

/**
 * Server configuration from @server decorator
 */
interface ServerConfig {
  url: string;
  protocol: string;
  description?: string;
}

/**
 * Parse URL into host and pathname components
 */
function parseServerUrl(url: string): { host: string; pathname?: string } {
  try {
    // Handle protocol-prefixed URLs
    if (url.includes('://')) {
      const urlObj = new URL(url);
      return {
        host: urlObj.host,
        pathname: urlObj.pathname !== '/' ? urlObj.pathname : undefined
      };
    }
    // Handle plain host:port format
    return { host: url };
  } catch {
    // Fallback if URL parsing fails
    return { host: url };
  }
}

/**
 * Document Builder class
 * 
 * Handles creation and modification of AsyncAPI document structures
 */
export class DocumentBuilder {
  /**
   * Create initial AsyncAPI document structure
   * Extracts server configurations from program state if available
   */
  createInitialDocument(program: Program): Effect.Effect<AsyncAPIObject, never, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Creating initial AsyncAPI document");
      
      // Build servers from program state if available
      const servers: Record<string, ServerObject> = {};
      
      try {
        if (program && typeof program.stateMap === 'function') {
          const serverConfigsMap = program.stateMap(stateSymbols.serverConfigs);
          if (serverConfigsMap && serverConfigsMap.size > 0) {
            for (const [target, config] of serverConfigsMap) {
              const serverConfig = config as ServerConfig;
              const serverName = typeof target === 'object' && 'name' in target 
                ? String(target.name) 
                : 'default';
              const { host, pathname } = parseServerUrl(serverConfig.url);
              servers[serverName] = {
                host,
                protocol: serverConfig.protocol,
                ...(pathname && { pathname }),
                ...(serverConfig.description && { description: serverConfig.description })
              };
            }
          }
        }
      } catch {
        // Ignore errors when accessing state - program may not have stateMap
      }
      
      const document: AsyncAPIObject = {
        asyncapi: "3.0.0",
        info: {
          title: "AsyncAPI Specification",
          version: "1.0.0",
          description: "Generated from TypeSpec with @lars-artmann/typespec-asyncapi"
        },
        channels: {},
        operations: {},
        components: {
          schemas: {},
          messages: {},
          securitySchemes: {}
        },
        ...(Object.keys(servers).length > 0 && { servers })
      };
      
      return document;
    });
  }
  
  /**
   * Update document info section
   */
  updateDocumentInfo(
    document: AsyncAPIObject, 
    updates: Partial<{ title: string; version: string; description: string }>
  ): Effect.Effect<AsyncAPIObject, never, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Updating document info");
      
      const updatedDocument: AsyncAPIObject = {
        ...document,
        info: {
          ...document.info,
          ...updates
        }
      };
      
      return updatedDocument;
    });
  }
  
  /**
   * Initialize components section with empty structures
   */
  initializeComponents(document: AsyncAPIObject): Effect.Effect<AsyncAPIObject, never, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Initializing components");
      
      const components = document.components ?? {};
      
      const result: AsyncAPIObject = {
        ...document,
        components: {
          schemas: components.schemas ?? {},
          messages: components.messages ?? {},
          securitySchemes: components.securitySchemes ?? {},
          ...components
        }
      };
      
      return result;
    });
  }
  
  /**
   * Initialize full document structure
   */
  initializeDocumentStructure(document: AsyncAPIObject): Effect.Effect<AsyncAPIObject, never, never> {
    const self = this;
    return Effect.gen(function*() {
      yield* Effect.log("Initializing document structure");
      
      // Ensure all required sections exist
      const initializedDoc: AsyncAPIObject = {
        ...document,
        channels: document.channels ?? {},
        operations: document.operations ?? {},
      };
      
      // Initialize components
      return yield* self.initializeComponents(initializedDoc);
    });
  }
}