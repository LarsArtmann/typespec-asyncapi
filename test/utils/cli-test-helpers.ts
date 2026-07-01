/**
 * CLI-Based Test Helpers
 *
 * Provides utilities for testing TypeSpec emitter via actual CLI compilation.
 * Replaces broken programmatic testing (createTestWrapper) with real CLI usage.
 *
 * @see docs/architecture/CLI-TEST-ARCHITECTURE.md
 */

import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { parse as parseYAML } from "yaml";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * Result from CLI compilation
 */
export interface CLITestResult {
  /** Exit code from tsp compile (0 = success) */
  exitCode: number;
  /** Standard output from compilation */
  stdout: string;
  /** Standard error from compilation */
  stderr: string;
  /** Parsed AsyncAPI document (if successful) */
  asyncapiDoc?: AsyncAPIObject;
  /** Parsed compiler errors from stderr */
  errors: string[];
  /** Working directory where test was executed */
  workdir: string;
}

/**
 * Options for CLI compilation
 */
export interface CLICompileOptions {
  /** Emitter-specific options */
  emitterOptions?: Record<string, unknown>;
  /** Working directory (creates temp if not specified) */
  workdir?: string;
  /** Compilation timeout in milliseconds */
  timeout?: number;
  /** Whether to cleanup workdir after test */
  autoCleanup?: boolean;
}

/**
 * Compile TypeSpec using CLI and return AsyncAPI output
 *
 * This is the core test helper that replaces the broken createTestWrapper() approach.
 * It compiles TypeSpec via actual TypeSpec CLI (`tsp compile`) and reads output from disk.
 *
 * @example
 * ```typescript
 * const result = await compileWithCLI(`
 *   import "@lars-artmann/typespec-asyncapi";
 *   using AsyncAPI;
 *
 *   @channel("user.created")
 *   @publish
 *   op userCreated(...UserEvent): void;
 * `)
 *
 * expect(result.exitCode).toBe(0)
 * expect(result.asyncapiDoc?.asyncapi).toBe('3.0.0')
 * ```
 *
 * @param sourceFileOrContent - Path to .tsp file or inline TypeSpec source
 * @param options - Compilation options
 * @returns Parsed AsyncAPI document and compilation metadata
 */
export async function compileWithCLI(
  sourceFileOrContent: string,
  options: CLICompileOptions = {},
): Promise<CLITestResult> {
  const workdir = options.workdir || (await createTempDir());
  const tspFile = join(workdir, "main.tsp");

  try {
    // Write TypeSpec source to disk
    if (
      sourceFileOrContent.includes("import") ||
      sourceFileOrContent.includes("model")
    ) {
      // Inline source code
      await fs.writeFile(tspFile, sourceFileOrContent, "utf-8");
    } else {
      // Path to fixture file
      await fs.copyFile(sourceFileOrContent, tspFile);
    }

    // Run tsp compile via CLI from project root (so it can find our emitter package)
    // Pass the test file path explicitly
    const { exitCode, stdout, stderr } = await runCommand(
      "npx",
      [
        "tsp",
        "compile",
        tspFile,
        "--emit",
        "@lars-artmann/typespec-asyncapi",
        "--output-dir",
        workdir,
      ],
      {
        cwd: process.cwd(), // Run from project root, not temp dir!
        timeout: options.timeout || 30000,
      },
    );

    // Read AsyncAPI output from disk
    // Output goes to {output-dir}/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
    const outputPath = join(
      workdir,
      "@lars-artmann",
      "typespec-asyncapi",
      "AsyncAPI.yaml",
    );
    let asyncapiDoc: AsyncAPIObject | undefined;

    try {
      const content = await fs.readFile(outputPath, "utf-8");
      asyncapiDoc = parseYAML(content) as AsyncAPIObject;
    } catch (err) {
      // Output not generated - not always an error (compile errors may prevent emission)
      // Don't throw here, let caller decide if missing output is a failure
    }

    // Parse compiler errors from stderr
    const errors = parseCompilerErrors(stderr);

    return {
      exitCode,
      stdout,
      stderr,
      asyncapiDoc,
      errors,
      workdir,
    };
  } finally {
    // Auto-cleanup if requested
    if (options.autoCleanup) {
      await cleanupTestDir(workdir);
    }
  }
}

/**
 * Run shell command and capture output
 *
 * Spawns a subprocess and returns exit code + stdout/stderr.
 * Includes timeout protection to prevent hanging tests.
 *
 * @param command - Command to execute (e.g., 'npx')
 * @param args - Command arguments (e.g., ['tsp', 'compile'])
 * @param options - Execution options
 * @returns Exit code and captured output
 */
async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; timeout: number },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (exitCode) => {
      resolve({ exitCode: exitCode || 0, stdout, stderr });
    });

    proc.on("error", (err) => {
      reject(new Error(`Command failed: ${err.message}`));
    });

    // Timeout protection
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`Command timeout after ${options.timeout}ms`));
    }, options.timeout);

    proc.on("exit", () => clearTimeout(timer));
  });
}

/**
 * Create temporary test directory
 *
 * Creates a unique directory under test/temp-output/ for test isolation.
 * Each test gets its own directory to prevent conflicts.
 *
 * @returns Absolute path to temp directory
 */
async function createTempDir(): Promise<string> {
  const tmpDir = join(
    process.cwd(),
    "test/temp-output",
    `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );
  await fs.mkdir(tmpDir, { recursive: true });
  return tmpDir;
}

/**
 * Parse TypeSpec compiler errors from stderr
 *
 * Extracts structured error messages from TypeSpec compiler output.
 * Helps identify compilation failures vs emitter bugs.
 *
 * @param stderr - Standard error output from tsp compile
 * @returns Array of error messages
 */
function parseCompilerErrors(stderr: string): string[] {
  const errors: string[] = [];

  // Match TypeSpec error format: "error TS1234: message"
  const errorPattern = /error\s+([A-Z0-9]+):\s+(.+)/g;

  let match;
  while ((match = errorPattern.exec(stderr)) !== null) {
    errors.push(`[${match[1]}] ${match[2]}`);
  }

  // Also capture generic errors that don't match pattern
  if (stderr.includes("error") && errors.length === 0) {
    errors.push(stderr.trim());
  }

  return errors;
}

/**
 * Cleanup test directory after test
 *
 * Removes temporary test files and directories.
 * Safe to call multiple times or on non-existent paths.
 *
 * @param workdir - Path to test working directory
 */
export async function cleanupTestDir(workdir: string): Promise<void> {
  try {
    await fs.rm(workdir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors (directory may not exist)
    // Don't fail tests due to cleanup issues
  }
}

/**
 * Create test fixture directory with TypeSpec files
 *
 * Useful for complex tests that need multiple .tsp files.
 *
 * @param files - Map of filename to content
 * @returns Path to fixture directory
 */
export async function createTestFixture(
  files: Record<string, string>,
): Promise<string> {
  const fixtureDir = await createTempDir();

  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(fixtureDir, filename);
    await fs.mkdir(join(fixtureDir, "..", filename, ".."), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  return fixtureDir;
}

/**
 * Assert AsyncAPI document structure
 *
 * Helper for common assertions on AsyncAPI output.
 *
 * @param doc - AsyncAPI document to validate
 */
export function assertValidAsyncAPI(
  doc: AsyncAPIObject | undefined,
): asserts doc is AsyncAPIObject {
  if (!doc) {
    throw new Error("AsyncAPI document is undefined");
  }

  if (doc.asyncapi !== "3.0.0") {
    throw new Error(`Expected AsyncAPI 3.0.0, got ${doc.asyncapi}`);
  }

  if (!doc.info) {
    throw new Error("AsyncAPI document missing info section");
  }
}

/**
 * Get AsyncAPI output path for a workdir
 *
 * @param workdir - Test working directory
 * @returns Path to AsyncAPI.yaml output
 */
export function getAsyncAPIOutputPath(workdir: string): string {
  return join(
    workdir,
    "tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml",
  );
}

/**
 * Check if AsyncAPI output exists
 *
 * @param workdir - Test working directory
 * @returns True if AsyncAPI.yaml exists
 */
export async function hasAsyncAPIOutput(workdir: string): Promise<boolean> {
  try {
    await fs.access(getAsyncAPIOutputPath(workdir));
    return true;
  } catch {
    return false;
  }
}
