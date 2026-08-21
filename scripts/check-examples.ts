/**
 * Example gate (F5.7): compile every examples/* project with the tsp CLI
 * (exercising the workspace-linked package) and validate each emitted
 * document against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * Run via `pnpm run check-examples` after `pnpm run build`.
 */
import Ajv from "ajv";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { parse as parseYAML } from "yaml";

const { join } = path;

const examplesRoot = join(import.meta.dirname, "..", "examples");
const asyncApiSchemaUrl = new URL(
  "../node_modules/@asyncapi/specs/schemas/3.1.0-without-$id.json",
  import.meta.url,
);

const ajv = new Ajv({ allErrors: true, strict: false });
const validateAsyncApi = ajv.compile(
  JSON.parse(readFileSync(asyncApiSchemaUrl, "utf8")),
);

interface ExampleResult {
  name: string;
  status: "pass" | "fail";
  detail: string;
}

function compileExample(name: string): void {
  const dir = join(examplesRoot, name);
  const outputDir = join(dir, "tsp-output");
  rmSync(outputDir, { recursive: true, force: true });
  for (const entry of readdirSync(dir)) {
    if (entry.endsWith(".tsp")) {
      execFileSync("pnpm", ["exec", "tsp", "compile", entry], {
        cwd: dir,
        stdio: "pipe",
      });
    }
  }
}

function findEmittedDocument(name: string): string | null {
  const dir = join(examplesRoot, name, "tsp-output");
  if (!existsSync(dir)) {
    return null;
  }
  const candidates: string[] = [];
  for (const entry of readdirSync(dir, { recursive: true })) {
    const file = String(entry);
    if (file.endsWith(".yaml") || file.endsWith(".json")) {
      candidates.push(join(dir, file));
    }
  }
  for (const candidate of candidates) {
    const parsed = parseDocument(candidate);
    if (parsed !== null && typeof parsed === "object" && "asyncapi" in parsed) {
      return candidate;
    }
  }
  return null;
}

function parseDocument(file: string): unknown {
  const raw = readFileSync(file, "utf8");
  return file.endsWith(".json") ? JSON.parse(raw) : parseYAML(raw);
}

const failures: ExampleResult[] = [];
const exampleNames = readdirSync(examplesRoot).filter(
  (entry) =>
    !entry.endsWith(".md") &&
    existsSync(join(examplesRoot, entry, "tspconfig.yaml")),
);

for (const name of exampleNames) {
  try {
    compileExample(name);
    const documentPath = findEmittedDocument(name);
    if (documentPath === null) {
      throw new Error("no AsyncAPI document emitted");
    }
    const document: unknown = parseDocument(documentPath);
    if (!validateAsyncApi(document)) {
      throw new Error(
        `AsyncAPI 3.1 validation failed: ${JSON.stringify(validateAsyncApi.errors)}`,
      );
    }
    console.log(`PASS ${name} (${documentPath.replace(examplesRoot, ".")})`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    failures.push({ name, status: "fail", detail });
    console.error(`FAIL ${name}: ${detail}`);
  }
}

if (failures.length > 0) {
  process.exit(1);
}
console.log(`All ${exampleNames.length} examples compiled and validated.`);
