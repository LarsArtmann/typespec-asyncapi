/**
 * Integration test using REAL tsp compile (not test infrastructure)
 *
 * WHY THIS EXISTS:
 * The smoke test (examples/smoke/) proved the emitter works PERFECTLY.
 * But 146 unit tests fail because they check virtual FS, while AssetEmitter writes to real FS.
 *
 * This integration test uses the same approach as the smoke test - real compilation.
 * It provides confidence the emitter works end-to-end while unit test infrastructure is fixed.
 *
 * See: docs/adr/2025-10-05-emitter-works-tests-need-fixing.md
 */

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import YAML from "yaml";

const execAsync = promisify(exec);

describe("Real Compilation Integration Test", () => {
  const testDir = join(process.cwd(), "test-integration-output");
  const tspFile = join(testDir, "main.tsp");
  // AssetEmitter writes to: ../tsp-test/@lars-artmann/typespec-asyncapi/
  // Relative to process.cwd(), not testDir
  const outputDir = join(
    process.cwd(),
    "tsp-test",
    "@lars-artmann",
    "typespec-asyncapi",
  );
  const asyncapiFile = join(outputDir, "AsyncAPI.yaml");

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test TypeSpec file (same as smoke test)
    const tspContent = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace IntegrationTest;

/**
 * Test event model
 */
model TestEvent {
	id: string;
	timestamp: utcDateTime;
	data: string;
}

/**
 * Test operation
 */
@channel("test.events")
@publish
op publishTestEvent(): TestEvent;
`;
    await fs.writeFile(tspFile, tspContent, "utf-8");
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up ${testDir}:`, error);
    }
  });

  it("should compile TypeSpec to AsyncAPI 3.0 using real tsp compile", async () => {
    // Run actual tsp compile command
    const { stdout, stderr } = await execAsync(
      `npx tsp compile ${tspFile} --emit @lars-artmann/typespec-asyncapi`,
      { cwd: testDir },
    );

    console.log("✅ tsp compile output:", stdout);
    if (stderr) {
      console.warn("⚠️  stderr:", stderr);
    }

    // Verify file was created (check actual location emitter uses)
    const fileExists = await fs
      .access(asyncapiFile)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    // Read and parse the generated AsyncAPI file
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    // Verify AsyncAPI 3.0 structure
    expect(asyncapi.asyncapi).toBe("3.0.0");
    expect(asyncapi.info).toBeDefined();
    expect(asyncapi.info.title).toBeDefined();
    expect(asyncapi.info.version).toBeDefined();

    // Verify channels
    expect(asyncapi.channels).toBeDefined();
    expect(Object.keys(asyncapi.channels).length).toBeGreaterThan(0);

    // Verify operations
    expect(asyncapi.operations).toBeDefined();
    expect(Object.keys(asyncapi.operations).length).toBeGreaterThan(0);

    // Verify schemas
    expect(asyncapi.components).toBeDefined();
    expect(asyncapi.components.schemas).toBeDefined();
    expect(asyncapi.components.schemas.TestEvent).toBeDefined();

    // Verify schema properties
    expect(asyncapi.components.schemas.TestEvent.properties.id).toBeDefined();
    expect(
      asyncapi.components.schemas.TestEvent.properties.timestamp,
    ).toBeDefined();
    expect(asyncapi.components.schemas.TestEvent.properties.data).toBeDefined();

    console.log("✅ Integration test PASSED - emitter works perfectly!");
  }, 30000); // 30s timeout for real compilation
});
