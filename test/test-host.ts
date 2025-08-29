/**
 * Test host setup for AsyncAPI emitter testing
 */

import { createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

/**
 * Test library for AsyncAPI emitter
 */
export const AsyncAPITestLibrary = createTestLibrary({
  name: "@typespec/asyncapi",
  packageRoot: fileURLToPath(new URL("..", import.meta.url)),
});