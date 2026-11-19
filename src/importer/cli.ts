#!/usr/bin/env node
import { link, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { importAsyncAPI } from "./convert.js";
import { ImportInputError } from "./diagnostics.js";

const usage = `Usage: tsp-asyncapi <path> --output-dir <directory> [--namespace <name>]

Import a local AsyncAPI 3.1 YAML or JSON description into main.tsp.
Options:
  --output-dir   Directory for the generated file (required).
  --namespace    Override the namespace derived from the API title.
  --help         Show this help.`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean" },
      "output-dir": { type: "string" },
      namespace: { type: "string" },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const outputDir = values["output-dir"];
  const [input] = positionals;
  if (!input || positionals.length !== 1 || !outputDir) {
    throw new Error(`Expected one input path and --output-dir.\n${usage}`);
  }
  const result = await importAsyncAPI(
    await readFile(input, "utf8"),
    values.namespace,
  );
  for (const warning of result.warnings) {
    console.error(
      `warning ${warning.code} #${warning.pointer}: ${warning.message}`,
    );
  }
  await mkdir(outputDir, { recursive: true });
  const target = path.join(outputDir, "main.tsp");
  const tempDir = await mkdtemp(path.join(outputDir, ".tsp-asyncapi-"));
  try {
    const staged = path.join(tempDir, "main.tsp");
    await writeFile(staged, result.source, { encoding: "utf8", flag: "wx" });
    // A hard link publishes the complete file without replacing an existing target.
    await link(staged, target).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "EEXIST") {
        throw new Error(`Refusing to overwrite ${target}.`, { cause: error });
      }
      throw error;
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// oxlint-disable-next-line node/no-top-level-await -- The executable is not a library entry point.
await main().catch((error: unknown) => {
  const location =
    error instanceof ImportInputError ? ` #${error.pointer}` : "";
  console.error(
    `tsp-asyncapi${location}: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
