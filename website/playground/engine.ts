/**
 * Browser playground engine.
 *
 * Runs the REAL TypeSpec compiler and the REAL typespec-asyncapi emitter
 * against an in-memory file system. Nothing here is mocked: the only thing
 * that differs from `tsp compile` is where the files live.
 *
 * This module is bundled separately (see `scripts/build-playground.mjs`) and
 * lazy-loaded by the landing page, so it never blocks first paint.
 */
import {
  compile,
  createSourceFile,
  getSourceFileKindFromExt,
  resolvePath,
  type CompilerHost,
} from "@typespec/compiler";
import * as compilerStdIndex from "../../node_modules/@typespec/compiler/dist/src/lib/tsp-index.js";
import * as compilerIntrinsicIndex from "../../node_modules/@typespec/compiler/dist/src/lib/intrinsic/tsp-index.js";
import * as emitterModule from "../../dist/src/index.js";
import * as emitterTspIndex from "../../dist/src/tsp-index.js";
import {
  compilerPackageJson,
  compilerStdlib,
  emitterMainTsp,
  emitterPackageJson,
} from "./generated-assets.js";

const LIBRARY = "@lars-artmann/typespec-asyncapi";
const ROOT = "/playground";

const EMITTER_ENTRY =
  "./node_modules/@lars-artmann/typespec-asyncapi/dist/src/index.js";
const EMITTER_TSP_INDEX =
  "./node_modules/@lars-artmann/typespec-asyncapi/dist/src/tsp-index.js";
const COMPILER_STD_INDEX =
  "./node_modules/@typespec/compiler/dist/src/lib/tsp-index.js";
const COMPILER_INTRINSIC_INDEX =
  "./node_modules/@typespec/compiler/dist/src/lib/intrinsic/tsp-index.js";

export interface PlaygroundDiagnostic {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface CompileResult {
  output: string;
  diagnostics: PlaygroundDiagnostic[];
}

const resolve = (path: string): string => resolvePath(ROOT, path);

function createVirtualFs(): Map<string, string> {
  const fs = new Map<string, string>();

  for (const [relativePath, contents] of Object.entries(compilerStdlib)) {
    fs.set(resolve(relativePath), contents);
  }

  fs.set(
    resolve("./package.json"),
    JSON.stringify({ name: "playground", version: "0.0.0", type: "module" }),
  );
  fs.set(
    resolve("./node_modules/@typespec/compiler/package.json"),
    compilerPackageJson,
  );
  fs.set(resolve(COMPILER_STD_INDEX), "");
  fs.set(resolve(COMPILER_INTRINSIC_INDEX), "");

  fs.set(
    resolve("./node_modules/@lars-artmann/typespec-asyncapi/package.json"),
    emitterPackageJson,
  );
  fs.set(
    resolve("./node_modules/@lars-artmann/typespec-asyncapi/lib/main.tsp"),
    emitterMainTsp,
  );
  fs.set(resolve(EMITTER_ENTRY), "");
  fs.set(resolve(EMITTER_TSP_INDEX), "");

  return fs;
}

const jsImports = new Map<string, Promise<Record<string, unknown>>>([
  [resolve(EMITTER_ENTRY), Promise.resolve(emitterModule)],
  [resolve(EMITTER_TSP_INDEX), Promise.resolve(emitterTspIndex)],
  [resolve(COMPILER_STD_INDEX), Promise.resolve(compilerStdIndex)],
  [resolve(COMPILER_INTRINSIC_INDEX), Promise.resolve(compilerIntrinsicIndex)],
]);

function createHost(virtualFs: Map<string, string>): CompilerHost {
  const read = (path: string): string => {
    const contents = virtualFs.get(path);
    if (contents === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return contents;
  };

  const host = {
    async readUrl(url: string) {
      return createSourceFile(read(url), url);
    },
    async readFile(path: string) {
      const resolved = resolve(path);
      return createSourceFile(read(resolved), resolved);
    },
    async writeFile(path: string, content: string) {
      virtualFs.set(resolve(path), content);
    },
    async readDir(path: string) {
      const prefix = `${resolve(path)}/`;
      const entries = [...virtualFs.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length))
        .map((entry) => {
          const separator = entry.indexOf("/");
          return separator === -1 ? entry : entry.slice(0, separator);
        });
      return [...new Set(entries)];
    },
    async rm(path: string, options?: { recursive?: boolean }) {
      const resolved = resolve(path);
      if (options?.recursive && !virtualFs.has(resolved)) {
        for (const key of [...virtualFs.keys()]) {
          if (key.startsWith(`${resolved}/`)) {
            virtualFs.delete(key);
          }
        }
        return;
      }
      virtualFs.delete(resolved);
    },
    getLibDirs() {
      return [resolve("./node_modules/@typespec/compiler/lib/std")];
    },
    getExecutionRoot() {
      return resolve("./node_modules/@typespec/compiler");
    },
    async getJsImport(path: string) {
      const resolved = resolve(path);
      const module = jsImports.get(resolved);
      if (module === undefined) {
        throw new Error(`Module not found: ${resolved}`);
      }
      return module;
    },
    async stat(path: string) {
      const resolved = resolve(path);
      if (virtualFs.has(resolved)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      for (const key of virtualFs.keys()) {
        if (key.startsWith(resolved) && key !== resolved) {
          return { isDirectory: () => true, isFile: () => false };
        }
      }
      throw new Error(`File not found: ${resolved}`);
    },
    async realpath(path: string) {
      return path;
    },
    getSourceFileKind: getSourceFileKindFromExt,
    logSink: { log() {} },
    mkdirp: async (path: string) => path,
    fileURLToPath: (url: string) => String(url).replace(/^file:\/\//u, ""),
    pathToFileURL: (path: string) => `file://${path}`,
  };

  return host as unknown as CompilerHost;
}

export async function compileToAsyncAPI(
  source: string,
): Promise<CompileResult> {
  const virtualFs = createVirtualFs();
  virtualFs.set(resolve("./main.tsp"), source);

  const program = await compile(createHost(virtualFs), resolve("./main.tsp"), {
    emit: [LIBRARY],
    options: { [LIBRARY]: { "file-type": "yaml" } },
    outputDir: resolve("./out"),
    noEmit: false,
  });

  const diagnostics: PlaygroundDiagnostic[] = program.diagnostics.map(
    (diagnostic) => ({
      severity: String(diagnostic.severity) === "error" ? "error" : "warning",
      code: String(diagnostic.code),
      message: diagnostic.message,
    }),
  );

  const outputKey = [...virtualFs.keys()].find(
    (key) => /asyncapi\.ya?ml$/u.test(key) && !key.endsWith("package.json"),
  );

  return {
    output: outputKey === undefined ? "" : (virtualFs.get(outputKey) ?? ""),
    diagnostics,
  };
}
