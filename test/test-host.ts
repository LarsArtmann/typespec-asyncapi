/**
 * Test host setup for AsyncAPI emitter testing
 */

import { createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Test library for AsyncAPI emitter - simplified approach
 */
export const AsyncAPITestLibrary = createTestLibrary({
  name: "@larsartmann/typespec-asyncapi",
  packageRoot,
});