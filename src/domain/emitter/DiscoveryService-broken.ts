/**
 * Simple Discovery Service
 * 
 * MINIMAL WORKING VERSION: Basic TypeSpec discovery
 * Focus on getting compilation working first
 */

import { Effect } from "effect";
import type { Program } from "@typespec/compiler";

/**
 * Discovery result interface
 */
export type DiscoveryResult = {
  models: string[];
  operations: string[];
  namespaces: string[];
  decorators: string[];
}

/**
 * Simple Discovery Service class
 */
export class DiscoveryService {
  /**
   * Discover models in TypeSpec program
   */
  static discoverModels(program: Program): Effect.Effect<string[], Error, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Discovering models in TypeSpec program");
      
      try {
        const models: string[] = [];
        
        for (const [_, entity] of program.stateMap) {
          if (entity.kind === "Model") {
            models.push(entity.name ?? "unnamed_model");
          }
        }
        
        yield* Effect.log(`Discovered ${models.length} models`);
        return models;
        
      } catch (error) {
        yield* Effect.logError(`Model discovery failed: ${String(error)}`);
        return [];
      }
    });
  }

  /**
   * Discover operations in TypeSpec program
   */
  static discoverOperations(program: Program): Effect.Effect<string[], Error, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Discovering operations in TypeSpec program");
      
      try {
        const operations: string[] = [];
        
        for (const [_, entity] of program.stateMap) {
          if (entity.kind === "Operation") {
            operations.push(entity.name ?? "unnamed_operation");
          }
        }
        
        yield* Effect.log(`Discovered ${operations.length} operations`);
        return operations;
        
      } catch (error) {
        yield* Effect.logError(`Operation discovery failed: ${String(error)}`);
        return [];
      }
    });
  }

  /**
   * Discover namespaces in TypeSpec program
   */
  static discoverNamespaces(program: Program): Effect.Effect<string[], Error, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Discovering namespaces in TypeSpec program");
      
      try {
        const namespaces: string[] = [];
        
        for (const [_, entity] of program.stateMap) {
          if (entity.kind === "Namespace") {
            namespaces.push(entity.name ?? "unnamed_namespace");
          }
        }
        
        yield* Effect.log(`Discovered ${namespaces.length} namespaces`);
        return namespaces;
        
      } catch (error) {
        yield* Effect.logError(`Namespace discovery failed: ${String(error)}`);
        return [];
      }
    });
  }

  /**
   * Discover decorators in TypeSpec program
   */
  static discoverDecorators(program: Program): Effect.Effect<string[], Error, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Discovering decorators in TypeSpec program");
      
      try {
        const decorators: string[] = [];
        
        for (const [_, entity] of program.stateMap) {
          for (const decorator of entity.decorators) {
            decorators.push(decorator.decorator.name);
          }
        }
        
        yield* Effect.log(`Discovered ${decorators.length} decorators`);
        return [...new Set(decorators)]; // Remove duplicates
        
      } catch (error) {
        yield* Effect.logError(`Decorator discovery failed: ${String(error)}`);
        return [];
      }
    });
  }

  /**
   * Perform complete discovery analysis
   */
  static analyzeProgram(program: Program): Effect.Effect<DiscoveryResult, Error, never> {
    return Effect.gen(function*() {
      const models = yield* DiscoveryService.discoverModels(program);
      const operations = yield* DiscoveryService.discoverOperations(program);
      const namespaces = yield* DiscoveryService.discoverNamespaces(program);
      const decorators = yield* DiscoveryService.discoverDecorators(program);
      
      return {
        models,
        operations,
        namespaces,
        decorators
      };
    });
  }
}