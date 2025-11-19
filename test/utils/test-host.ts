/**
 * Test host setup for AsyncAPI emitter testing
 */

//TODO: DUPLICATE TEST LIBRARY DEFINITION! This duplicates createAsyncAPITestLibrary() in test-helpers.ts!
//TODO: TEST INFRASTRUCTURE CHAOS - Multiple ways to create same test library without coordination!
//TODO: DRY VIOLATION CATASTROPHE - Same library creation logic in 2+ different files!
//TODO: INCONSISTENT APPROACH - test-helpers.ts uses async function, this uses const export!
import { createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

//TODO: HARDCODED PATH RESOLUTION! ".." path calculation fragile and environment-dependent!
//TODO: URL RESOLUTION BRITTLENESS - What happens if import.meta.url changes or is undefined?
//TODO: PATH CALCULATION ANTI-PATTERN - Should use proper package resolution utilities!
const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Test library for AsyncAPI emitter - simplified approach
 */
//TODO: "SIMPLIFIED APPROACH" IS DUPLICATE COMPLEXITY! We have 2 test library creation patterns!
//TODO: LIBRARY NAME HARDCODED AGAIN! "@lars-artmann/typespec-asyncapi" duplicated without abstraction!
//TODO: CONFIGURATION INCONSISTENCY - Missing typespecFileFolder and jsFileFolder from test-helpers.ts!
//TODO: TEST LIBRARY FRAGMENTATION - Which one should tests use? This creates confusion!
export const AsyncAPITestLibrary = createTestLibrary({
  name: "@lars-artmann/typespec-asyncapi",
  packageRoot,
});
