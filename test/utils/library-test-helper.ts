/**
 * Library-aware test helper
 * Properly loads TypeSpec AsyncAPI library for test framework usage
 */

import { createTestHost } from "@typespec/compiler/testing"
import { join } from "path"

/**
 * Create test host with our AsyncAPI library loaded
 */
export async function createAsyncAPITestHost() {
	const host = await createTestHost()
	
	// Add our library to host with proper resolution
	host.addTypeSpecFile("library.tsp", `
import "./src/index.js";

using TypeSpec.AsyncAPI;
	`)
	
	// Add library to compiler search path
	host.compilerHost.addAdditionalFile(
		join(process.cwd(), "src", "index.js"), 
		""
	)
	
	return host
}