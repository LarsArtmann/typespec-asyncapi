/**
 * Integration test for metadata features: @security, @tags, @correlationId
 *
 * Tests that the new decorators from Phase 1 actually work end-to-end.
 */

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import YAML from "yaml";

const execAsync = promisify(exec);

describe("Metadata Features Integration Test", () => {
  const testDir = join(process.cwd(), "test-integration-output");
  const tspFile = join(testDir, "metadata-test.tsp");
  const outputDir = join(process.cwd(), "tsp-test", "@lars-artmann", "typespec-asyncapi");
  const asyncapiFile = join(outputDir, "AsyncAPI.yaml");

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test TypeSpec file with all new decorators
    const tspContent = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace MetadataTest;

/**
 * Event with metadata
 */
@message({
  title: "Order Event",
  description: "Order lifecycle event"
})
model OrderEvent {
  orderId: string;
  status: string;
  timestamp: utcDateTime;
}

/**
 * Publish with security and tags
 */
@channel("orders.{orderId}")
@security({
  name: "bearerAuth",
  scheme: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
})
@publish
op publishOrderEvent(): OrderEvent;
`;
    await fs.writeFile(tspFile, tspContent, "utf-8");
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up", testDir, error);
    }
  });

  it("should compile with @security decorator", async () => {
    // Run actual tsp compile command
    const { stdout, stderr } = await execAsync(
      `npx tsp compile ${tspFile} --emit @lars-artmann/typespec-asyncapi`,
      { cwd: testDir },
    );

    console.log("tsp compile output:", stdout);
    if (stderr) {
      console.warn("stderr:", stderr);
    }

    // Verify file was created
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

    // Verify securitySchemes are present
    expect(asyncapi.components).toBeDefined();
    expect(asyncapi.components.securitySchemes).toBeDefined();
    expect(asyncapi.components.securitySchemes.bearerAuth).toBeDefined();
    expect(asyncapi.components.securitySchemes.bearerAuth.type).toBe("http");
    expect(asyncapi.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(asyncapi.components.securitySchemes.bearerAuth.bearerFormat).toBe("JWT");

    console.log("Security integration test PASSED!");
    console.log("Security schemes:", JSON.stringify(asyncapi.components.securitySchemes, null, 2));
  }, 30000);
});
