#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  try {
    await writeFile(target, result.source, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      throw new Error(`Refusing to overwrite ${target}.`, { cause: error });
    }
    throw error;
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
