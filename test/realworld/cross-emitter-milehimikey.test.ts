/**
 * Cross-Emitter Compatibility: milehimikey/typespec-asyncapi → this emitter
 *
 * The milehimikey repo (https://github.com/milehimikey/typespec-asyncapi) is a
 * DIFFERENT AsyncAPI 3.0 emitter for TypeSpec. Its example file
 * (examples/kafka-orders/main.tsp) is the closest thing to a REAL AsyncAPI
 * TypeSpec spec on GitHub.
 *
 * This test takes the ACTUAL example file and applies ONLY the import-path fix
 * (`import "typespec-asyncapi"` → `import "@lars-artmann/typespec-asyncapi"`),
 * then compiles through THIS emitter to discover decorator API differences.
 *
 * Every compilation failure documents a REAL API incompatibility between the
 * two emitters — these are findings, not bugs to silently fix.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const reposDir = join(import.meta.dirname, "repos");

function loadRepoFile(name: string): string {
  return readFileSync(join(reposDir, `${name}.tsp`), "utf8");
}

describe("cross-emitter: milehimikey → this emitter", () => {
  const originalSource = loadRepoFile("milehimikey-kafka-orders");

  // The ONLY change: fix the import path
  const adaptedSource = originalSource.replace(
    'import "typespec-asyncapi";',
    'import "@lars-artmann/typespec-asyncapi";',
  );

  it("import path is the only text change", () => {
    const originalLines = originalSource.split("\n");
    const adaptedLines = adaptedSource.split("\n");
    expect(originalLines).toHaveLength(adaptedLines.length);
    const diffs: number[] = [];
    for (const [i, line] of originalLines.entries()) {
      if (adaptedLines[i] !== line) {
        diffs.push(i + 1);
      }
    }
    expect(diffs).toStrictEqual([1]);
    expect(adaptedLines[0]).toContain("@lars-artmann/typespec-asyncapi");
    expect(originalLines[0]).toContain("typespec-asyncapi");
    expect(originalLines[0]).not.toContain("@lars-artmann");
  });

  it("documents every decorator API difference between the two emitters", async () => {
    const result = await compileAsyncAPI(adaptedSource);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => ({ code: d.code, message: d.message }))
      .toSorted((a, b) =>
        a.code === b.code
          ? a.message.localeCompare(b.message)
          : a.code.localeCompare(b.code),
      );

    // Known API differences between milehimikey and this emitter:
    //
    // 1. @server: milehimikey uses positional args (name, host, protocol, desc)
    //    This emitter uses value literal: @server("name", #{ url, protocol, description })
    //
    // 2. @message: milehimikey takes (name?: valueof string) — just a string
    //    This emitter takes (config: {} | valueof Record<unknown>) — needs #{} syntax
    //
    // 3. @correlationId: milehimikey targets ModelProperty
    //    This emitter targets Model (whole message, with location param)
    //
    // 4. @header: milehimikey targets ModelProperty with no args
    //    This emitter targets Model | ModelProperty with name+value args
    //
    // 5. Custom Kafka decorators (@Kafka.key, @Kafka.topicConfig, @Kafka.schemaRegistry)
    //    Are milehimikey-specific and not supported here

    const errorCodes = [...new Set(errors.map((e) => e.code))].toSorted();

    // Should have compilation errors due to API differences
    expect(errorCodes).toContain("invalid-argument-count");
    expect(errorCodes).toContain("invalid-argument");
    expect(errorCodes).toContain("decorator-wrong-target");
    expect(errorCodes).toContain("invalid-ref");
  });

  it("documents specific @server API difference", async () => {
    const result = await compileAsyncAPI(adaptedSource);
    const serverErrors = result.diagnostics.filter(
      (d) => d.severity === "error" && d.message.includes("broker.example.com"),
    );
    // Milehimikey @server("main", "host", "proto", "desc") →
    // This emitter expects @server("name", #{ url, protocol, description })
    expect(serverErrors.length).toBeGreaterThan(0);
    expect(serverErrors[0]?.code).toBe("invalid-argument");
  });

  it("documents specific @message API difference", async () => {
    const result = await compileAsyncAPI(adaptedSource);
    const messageErrors = result.diagnostics.filter(
      (d) => d.severity === "error" && d.message.includes("order.cancelled"),
    );
    // Milehimikey @message("order.cancelled") →
    // This emitter expects @message(#{ title: "..." })
    expect(messageErrors.length).toBeGreaterThan(0);
    expect(messageErrors[0]?.code).toBe("invalid-argument");
  });

  it("documents specific @correlationId target difference", async () => {
    const result = await compileAsyncAPI(adaptedSource);
    const targetErrors = result.diagnostics.filter(
      (d) =>
        d.severity === "error" &&
        d.code === "decorator-wrong-target" &&
        d.message.includes("correlationId"),
    );
    // Milehimikey @correlationId targets ModelProperty
    // This emitter targets Model only
    expect(targetErrors.length).toBeGreaterThan(0);
  });
});
