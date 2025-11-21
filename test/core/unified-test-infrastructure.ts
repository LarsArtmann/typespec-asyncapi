/**
 * 🏗️ UNIFIED TEST INFRASTRUCTURE
 * 
 * Eliminates duplicate test host systems
 * Provides single source of truth for real compilation testing
 * Uses strongly-typed configuration throughout
 */

import { createTestLibrary, createTestHost, type TestHost } from "@typespec/compiler/testing";
import type { Program } from "@typespec/compiler";
import { $lib } from "../../src/lib.js";
import { createAsyncAPITestLibrary as createLibrary } from "../utils/test-helpers.js";

/**
 * Test infrastructure options
 * Strongly typed configuration for test host creation
 */
export interface UnifiedTestOptions {
  readonly libraries?: string[];
  readonly compilerOptions?: Record<string, unknown>;
  readonly enableDebug?: boolean;
}

/**
 * Real AsyncAPI Test Host Factory
 * 
 * Creates a properly configured test host with our library
 * Eliminates duplicate test infrastructure
 */
export async function createUnifiedAsyncAPITestHost(
  options: UnifiedTestOptions = {}
): Promise<TestHost> {
  // Create our library once
  const asyncAPILibrary = await createLibrary();
  
  // Create test host with our library
  return createTestHost({
    libraries: [asyncAPILibrary],
    compilerOptions: options.compilerOptions ?? {},
    ...options
  });
}

/**
 * Real compilation result with strong typing
 * 
 * Eliminates 'any' type disasters in test infrastructure
 */
export interface RealCompilationResult {
  readonly program: Program;
  readonly diagnostics: readonly import("@typespec/compiler").Diagnostic[];
  readonly asyncapi?: unknown;
  readonly outputs: ReadonlyMap<string, string>;
}

/**
 * Real compilation function
 * 
 * Performs actual TypeSpec compilation without mocking
 * Returns properly typed results
 */
export async function compileRealAsyncAPI(
  typespecCode: string,
  options: UnifiedTestOptions = {}
): Promise<RealCompilationResult> {
  // Create test host
  const host = await createUnifiedAsyncAPITestHost(options);
  
  // Add TypeSpec code with proper library import
  host.addTypeSpecFile("main.tsp", `
    import "@lars-artmann/typespec-asyncapi";
    
    ${typespecCode}
  `);
  
  // Compile
  const program = await host.compile("main.tsp");
  
  // Return strongly typed result
  return {
    program,
    diagnostics: program.diagnostics,
    asyncapi: undefined, // Will be populated by emitter
    outputs: new Map()
  };
}

/**
 * Legacy compatibility exports
 * 
 * TODO: Remove after migrating all tests to unified infrastructure
 */
export { createUnifiedAsyncAPITestHost as createAsyncAPITestHost };
export type { UnifiedTestOptions as TestHostOptions };
export type { RealCompilationResult as TypeSpecCompileResult };