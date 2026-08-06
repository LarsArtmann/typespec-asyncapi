import { performance } from "node:perf_hooks";
import {
  generateFixture,
  estimateSpecSize,
  type FixtureOptions,
} from "./fixture-generator.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";

interface BenchmarkResult {
  label: string;
  channels: number;
  models: number;
  specBytes: number;
  compileMs: number;
  outputBytes: number;
  schemaCount: number;
}

const results: BenchmarkResult[] = [];

const SIZES: { label: string; options: FixtureOptions }[] = [
  {
    label: "10 channels",
    options: {
      channelCount: 10,
      modelsPerChannel: 1,
      propertiesPerModel: 5,
      sharedModelCount: 3,
    },
  },
  {
    label: "50 channels",
    options: {
      channelCount: 50,
      modelsPerChannel: 1,
      propertiesPerModel: 6,
      sharedModelCount: 5,
    },
  },
  {
    label: "100 channels",
    options: {
      channelCount: 100,
      modelsPerChannel: 1,
      propertiesPerModel: 6,
      sharedModelCount: 10,
    },
  },
  {
    label: "200 channels",
    options: {
      channelCount: 200,
      modelsPerChannel: 1,
      propertiesPerModel: 8,
      sharedModelCount: 15,
    },
  },
];

describe("performance benchmarks", () => {
  for (const { label, options } of SIZES) {
    it(`compiles ${label} within reasonable time`, async () => {
      const source = generateFixture(options);
      const specInfo = estimateSpecSize(source);

      const start = performance.now();
      const result = await compileAsyncAPI(source, {
        "file-type": "json",
      } as never);
      const elapsed = performance.now() - start;

      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors).toStrictEqual([]);

      const outputJson = JSON.stringify(result.asyncApiDoc);
      const schemaCount = Object.keys(
        result.asyncApiDoc?.components?.schemas ?? {},
      ).length;

      results.push({
        label,
        channels: specInfo.channels,
        models: specInfo.models,
        specBytes: specInfo.bytes,
        compileMs: Math.round(elapsed),
        outputBytes: outputJson.length,
        schemaCount,
      });

      expect(result.asyncApiDoc).not.toBeNull();
      expect(schemaCount).toBeGreaterThan(0);
    }, 60_000);
  }

  it("reports benchmark results", () => {
    expect(results.length).toBeGreaterThanOrEqual(4);

    const lines: string[] = [
      "",
      "=== Performance Benchmark Results ===",
      "",
      "| Channels | Models | Spec KB | Output KB | Schemas | Time (ms) |",
      "|----------|--------|---------|-----------|---------|-----------|",
    ];

    for (const r of results) {
      lines.push(
        `| ${String(r.channels).padStart(8)} | ${String(r.models).padStart(6)} | ${(r.specBytes / 1024).toFixed(1).padStart(7)} | ${(r.outputBytes / 1024).toFixed(1).padStart(9)} | ${String(r.schemaCount).padStart(7)} | ${String(r.compileMs).padStart(9)} |`,
      );
    }

    lines.push("");
    console.log(lines.join("\n"));

    const smallest = results.at(0)!;
    const largest = results.at(-1)!;
    const scalingFactor = largest.channels / smallest.channels;
    const timeFactor = largest.compileMs / smallest.compileMs;

    console.log(
      `Scaling: ${scalingFactor.toFixed(1)}x channels → ${timeFactor.toFixed(1)}x time (linear if ~equal)`,
    );
  });
});
