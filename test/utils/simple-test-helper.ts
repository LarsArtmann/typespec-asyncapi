/**
 * Simple, reliable AsyncAPI test helper
 * Uses standard TypeSpec test framework without complex fallbacks
 */

import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "./test-helpers.js";

/**
 * Compile TypeSpec and return AsyncAPI document using standard framework
 */
export async function compileSimpleAsyncAPI(source: string): Promise<any> {
  const host = await createAsyncAPITestHost();
  host.addTypeSpecFile("main.tsp", source);

  await host.compile("./main.tsp");

  // Use standard test framework compilation
  const result = await compileAndGetAsyncAPI(host, "./main.tsp");

  return result;
}
