import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { playgroundExamples } from "../../website/src/data/playground.js";

const websiteDir = join(process.cwd(), "website");
const enginePath = join(websiteDir, "public", "playground", "engine.js");

interface EngineDiagnostic {
  severity: string;
  code: string;
  message: string;
}

interface PlaygroundEngine {
  compileToAsyncAPI: (
    source: string,
  ) => Promise<{ output: string; diagnostics: EngineDiagnostic[] }>;
}

describe("browser playground engine", () => {
  let engine: PlaygroundEngine;

  // eslint-disable-next-line vitest/no-hooks -- load the 1 MB engine bundle once for every case
  beforeAll(async () => {
    if (!existsSync(enginePath)) {
      execFileSync(
        "node",
        [join(websiteDir, "scripts", "build-playground.mjs")],
        { stdio: "pipe" },
      );
    }
    engine = (await import(pathToFileURL(enginePath).href)) as PlaygroundEngine;
  }, 180_000);

  it("exposes a working compile function", () => {
    expect(engine.compileToAsyncAPI).toBeTypeOf("function");
  });

  it.each(playgroundExamples.map((example) => [example.id, example] as const))(
    "compiles the %s example in-process",
    async (_id, example) => {
      const result = await engine.compileToAsyncAPI(example.source);
      const errors = result.diagnostics.filter(
        (diagnostic) => diagnostic.severity === "error",
      );
      expect(errors.map((diagnostic) => diagnostic.code)).toStrictEqual([]);
      expect(result.output).toContain("asyncapi: 3.1.0");
    },
    120_000,
  );

  it("reports unsupported protocols instead of emitting", async () => {
    const result =
      await engine.compileToAsyncAPI(`import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Broken" })
namespace Broken;

model Ping {
  id: string;
}

@channel("ping")
@publish
@protocol(#{ protocol: "carrier-pigeon" })
op sendPing(): Ping;
`);
    expect(result.output).toBe("");
    expect(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(" "),
    ).toContain("unsupported-protocol");
  }, 120_000);
});
