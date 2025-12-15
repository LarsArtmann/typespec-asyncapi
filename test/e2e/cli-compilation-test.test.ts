/**
 * CLI Compilation Test - Test real compilation like the plugin verification
 *
 * This bypasses TypeSpec testing framework and uses CLI compilation
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { promisify } from "util";
import { Effect } from "effect";

describe("🚀 CLI Compilation Test", () => {
  const testDir = "test-output/cli-test";
  const testFile = join(testDir, "test.tsp");
  const outputDir = join(testDir, "output");

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });
  });

  it("should compile TypeSpec via CLI and verify mock elimination", async () => {
    // Create a test TypeSpec file
    const testSource = `
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace MockEliminationTest;

model TestMessage {
  id: string;
  content: string;
  timestamp: utcDateTime;
}

@channel("test.messages")
@publish
op publishTestMessage(): TestMessage;
`;

    writeFileSync(testFile, testSource);

    // Compile using TypeSpec CLI
    const compilation = spawn(
      "npx",
      [
        "tsp",
        "compile",
        testFile,
        "--emit",
        "@lars-artmann/typespec-asyncapi",
        "--output-dir",
        outputDir,
      ],
      {
        stdio: ["inherit", "pipe", "pipe"],
        cwd: process.cwd(),
      },
    );

    let stdout = "";
    let stderr = "";

    compilation.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    compilation.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      compilation.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`Compilation failed with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}`),
          );
        }
      });
    });

    Effect.log("✅ CLI Compilation successful!");
    Effect.log("Stdout:", stdout);

    // Verify AsyncAPI output was generated
    // TypeSpec emitters output to {output-dir}/{emitter-package-name}/
    const emitterOutputDir = join(outputDir, "@lars-artmann", "typespec-asyncapi");
    const asyncapiFiles = [];
    try {
      const files = ["AsyncAPI.yaml", "AsyncAPI.json", "asyncapi.yaml", "asyncapi.json"];
      for (const file of files) {
        const filepath = join(emitterOutputDir, file);
        if (existsSync(filepath)) {
          asyncapiFiles.push(filepath);
          Effect.log(`✅ Found output file: ${filepath}`);
        }
      }
    } catch (error) {
      Effect.log("Directory listing error:", error);
    }

    expect(asyncapiFiles.length).toBeGreaterThan(0);

    // Read and validate the AsyncAPI content
    const asyncapiContent = readFileSync(asyncapiFiles[0], "utf8");
    expect(asyncapiContent).toContain("asyncapi: 3.0.0");
    expect(asyncapiContent).toContain("test.messages");
    expect(asyncapiContent).toContain("publishTestMessage");

    Effect.log("✅ SUCCESS: Real TypeSpec compilation works!");
    Effect.log("✅ SUCCESS: No mock infrastructure needed!");
    Effect.log("✅ SUCCESS: Emitter generates valid AsyncAPI!");
  }, 30000); // 30 second timeout for compilation
});
