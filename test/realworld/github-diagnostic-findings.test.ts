import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const reposDir = join(import.meta.dirname, "repos");

function loadFile(name: string): string {
  return readFileSync(join(reposDir, `${name}.tsp`), "utf8");
}

describe("github actual-file diagnostic findings", () => {
  it("bterlson/typespec-todo — missing imports + version incompatibility", async () => {
    const source = loadFile("bterlson-typespec-todo");
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => d.code);
    const uniqueCodes = [...new Set(errors)].toSorted();

    // Missing import packages (@typespec/http, /rest, /openapi3, etc)
    expect(uniqueCodes).toContain("import-not-found");
    // Unknown decorators from those packages (@route, @post, @query, etc)
    expect(uniqueCodes).toContain("invalid-ref");
    // @visibility("read") string syntax rejected by TypeSpec v1.13.0
    expect(uniqueCodes).toContain("invalid-argument");
    // @service({title: "..."}) uses {} not #{}
    expect(uniqueCodes).toContain("expect-value");
    // No AsyncAPI output produced (no @channel operations in original)
    expect(result.asyncApiDoc).toBeUndefined();
  });

  it("dansnow/typespec-events — custom package dependency missing", async () => {
    const source = loadFile("dansnow-typespec-events");
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => `[${d.code}] ${d.message}`);
    const uniqueErrors = [...new Set(errors)].toSorted();

    // @typespec-events/typespec package not installed
    expect(uniqueErrors.some((e) => e.includes("typespec-events"))).toBe(true);
    // @event decorator unknown (defined in missing package)
    expect(uniqueErrors.some((e) => e.includes("@event"))).toBe(true);
    // No AsyncAPI output
    expect(result.asyncApiDoc).toBeUndefined();
  });

  it("livesession/xyd — compiles successfully (pure data models)", async () => {
    const source = loadFile("livesession-xyd");
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error");

    expect(errors).toStrictEqual([]);
    // Pure data models compile cleanly — emitter generates schemas for all models
    expect(result.asyncApiDoc).toBeDefined();
    expect(result.asyncApiDoc?.asyncapi).toBe("3.1.0");
    const schemaCount = Object.keys(
      result.asyncApiDoc?.components?.schemas ?? {},
    ).length;
    expect(schemaCount).toBeGreaterThanOrEqual(30);
  });

  it("azure/azure-rest-api-specs EventGrid — missing Azure packages", async () => {
    const source = loadFile("azure-eventgrid");
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => d.code);
    const uniqueCodes = [...new Set(errors)].toSorted();

    // Azure-specific packages not installed
    expect(uniqueCodes).toContain("import-not-found");
    expect(uniqueCodes).toContain("invalid-ref");
    // No AsyncAPI output
    expect(result.asyncApiDoc).toBeUndefined();
  });

  it("milehimikey/typespec-asyncapi kafka-orders — different emitter API", async () => {
    const source = loadFile("milehimikey-kafka-orders");
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => `[${d.code}] ${d.message}`);
    const uniqueErrors = [...new Set(errors)].toSorted();

    // Import path differs: 'typespec-asyncapi' vs '@lars-artmann/typespec-asyncapi'
    expect(uniqueErrors.some((e) => e.includes("typespec-asyncapi"))).toBe(true);
    // No AsyncAPI output (import resolution fails)
    expect(result.asyncApiDoc).toBeUndefined();
  });
});
