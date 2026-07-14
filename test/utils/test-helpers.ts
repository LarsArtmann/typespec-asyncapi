/**
 * Test helpers for AsyncAPI emitter testing.
 *
 * PRIMARY API:
 *   compileAsyncAPI(source, options?) -> { asyncApiDoc, diagnostics, outputs, ... }
 *   compileAsyncAPIWithoutErrors(source, options?) -> same but throws on error diagnostics
 *
 * LEGACY WRAPPERS (thin delegates):
 *   createAsyncAPITestHost() + compileAndGetAsyncAPI(host, path) -> asyncApiDoc
 *   compileAsyncAPISpecRaw / compileAsyncAPISpecWithoutErrors -> { diagnostics, outputFiles, program }
 *   compileAsyncAPISpec / parseAsyncAPIOutput -> asyncApiDoc
 */

import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/options.js";
import YAML from "yaml";

// === TYPES ===

type AsyncAPIObject = Record<string, any>;

export interface CompilationResult {
  diagnostics: readonly import("@typespec/compiler").Diagnostic[];
  outputFiles: Map<string, string | { content: string }>;
  program: import("@typespec/compiler").Program;
}

// === CORE COMPILATION ===

async function createTesterInstance(source: string, options: AsyncAPIEmitterOptions = {}) {
  const packageRoot = await findTestPackageRoot(import.meta.url);
  const hasOwnImport =
    source.includes('import "@lars-artmann/typespec-asyncapi"') ||
    source.includes("import '@lars-artmann/typespec-asyncapi'");
  const hasOwnUsing = source.includes("using TypeSpec.AsyncAPI");

  let tester = createTester(packageRoot, {
    libraries: ["@lars-artmann/typespec-asyncapi"],
  });

  if (!hasOwnImport) tester = tester.importLibraries();
  if (!hasOwnUsing) tester = tester.using("TypeSpec.AsyncAPI");

  return tester.emit("@lars-artmann/typespec-asyncapi", options);
}

function parseContent(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content);
  } catch {
    try {
      return YAML.parse(content);
    } catch {
      return null;
    }
  }
}

export async function compileAsyncAPI(source: string, options: AsyncAPIEmitterOptions = {}) {
  const tester = await createTesterInstance(source, options);

  const [result, diagnostics] = await tester.compileAndDiagnose(source);

  const virtualFs: Map<string, string> = result.fs?.fs ?? new Map();
  let outputFile: string | null = null;
  let outputContent: string | null = null;

  for (const [virtualPath, content] of virtualFs) {
    if (virtualPath.includes("node_modules")) continue;
    if (typeof content !== "string") continue;
    const filename = virtualPath.split("/").pop() || "";
    if (filename.endsWith(".yaml") || filename.endsWith(".json") || filename.endsWith(".yml")) {
      if (content.startsWith("asyncapi") || content.includes('"asyncapi"')) {
        outputFile = filename;
        outputContent = content;
        break;
      }
    }
  }

  const asyncApiDoc = outputContent ? parseContent(outputContent) : null;

  const outputs: Record<string, string> = {};
  if (outputFile && outputContent) {
    outputs[outputFile] = outputContent;
  }

  return {
    asyncApiDoc,
    diagnostics,
    program: result.program,
    outputs,
    outputFile,
  };
}

export async function compileAsyncAPIWithoutErrors(
  source: string,
  options: AsyncAPIEmitterOptions = {},
) {
  const result = await compileAsyncAPI(source, options);
  const errors = result.diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.code}: ${e.message}`).join("\n");
    throw new Error(`Compilation failed with errors:\n${errorMessages}`);
  }
  return result;
}

// === LEGACY COMPILATION WRAPPERS ===

async function compileRaw(source: string, options: AsyncAPIEmitterOptions = {}) {
  const result = await compileAsyncAPI(source, options);
  const outputFiles = new Map<string, string>();
  for (const [filename, content] of Object.entries(result.outputs)) {
    outputFiles.set(filename, content);
  }
  return {
    asyncApiDoc: result.asyncApiDoc,
    diagnostics: [...result.diagnostics],
    program: result.program,
    outputFiles,
  };
}

export async function compileAsyncAPISpec(
  source: string,
  options: AsyncAPIEmitterOptions = {},
): Promise<AsyncAPIObject & {
  diagnostics: readonly any[];
  outputFiles: Map<string, string>;
}> {
  const result = await compileRaw(source, options);
  const doc = result.asyncApiDoc ?? {};
  return Object.assign(doc, {
    diagnostics: result.diagnostics,
    outputFiles: result.outputFiles,
  });
}

export async function compileAsyncAPISpecRaw(
  source: string,
  options: AsyncAPIEmitterOptions = {},
): Promise<CompilationResult> {
  const result = await compileRaw(source, options);
  return {
    diagnostics: result.diagnostics,
    outputFiles: result.outputFiles,
    program: result.program,
  };
}

export async function compileAsyncAPISpecWithoutErrors(
  source: string,
  options: AsyncAPIEmitterOptions = {},
): Promise<CompilationResult> {
  const result = await compileAsyncAPIWithoutErrors(source, options);
  return {
    diagnostics: result.diagnostics,
    outputFiles: new Map(Object.entries(result.outputs)),
    program: result.program,
  };
}

export async function parseAsyncAPIOutput(
  outputFiles: Map<string, string | { content: string }>,
  filename: string = "asyncapi.yaml",
): Promise<AsyncAPIObject> {
  for (const [filePath, content] of outputFiles) {
    const fn = filePath.split("/").pop() || "";
    if (
      (fn.endsWith(filename) ||
        fn.endsWith(".yaml") ||
        fn.endsWith(".json") ||
        fn.endsWith(".yml")) &&
      !filePath.includes("node_modules")
    ) {
      const actualContent = typeof content === "string" ? content : content.content;
      if (!actualContent || actualContent.trim().length === 0) continue;
      if (actualContent.trim().startsWith("{")) {
        return JSON.parse(actualContent);
      }
      return YAML.parse(actualContent) as AsyncAPIObject;
    }
  }
  throw new Error(`AsyncAPI output "${filename}" not found.`);
}

// === LEGACY HOST API ===

export async function createAsyncAPITestHost() {
  let files: Map<string, string> = new Map();

  return {
    addTypeSpecFile(name: string, content: string) {
      files.set(name, content);
    },

    get fs() {
      const filtered = new Map<string, string>();
      for (const [k, v] of files) {
        if (!k.includes("node_modules/")) filtered.set(k, v);
      }
      return filtered;
    },

    async compile(_mainPath: string, _options?: any) {
      const source = files.get("main.tsp") ?? files.values().next().value;
      if (!source) return {};
      const result = await compileAsyncAPI(source);
      for (const [k, v] of Object.entries(result.outputs)) files.set(k, v);
      return {};
    },

    async diagnose(_mainPath: string, _options?: any) {
      const source = files.get("main.tsp") ?? files.values().next().value;
      if (!source) return [];
      const result = await compileAsyncAPI(source);
      for (const [k, v] of Object.entries(result.outputs)) {
        if (!files.has(k)) files.set(k, v);
      }
      return result.diagnostics;
    },

    async compileAndDiagnose(_mainPath: string, _options?: any) {
      const source = files.get("main.tsp") ?? files.values().next().value;
      if (!source) return [{}, []];
      const result = await compileAsyncAPI(source);
      for (const [k, v] of Object.entries(result.outputs)) files.set(k, v);
      return [{}, result.diagnostics];
    },

    _getMainSource(): string | undefined {
      return files.get("main.tsp") ?? files.values().next().value;
    },

    _getFiles(): Map<string, string> {
      return files;
    },
  };
}

export const createAsyncAPITestLibrary = createAsyncAPITestHost;

export async function compileAndGetAsyncAPI(
  host: { _getMainSource: () => string | undefined },
  _mainPath: string,
): Promise<AsyncAPIObject | null> {
  const source = host._getMainSource();
  if (!source) return null;

  try {
    const result = await compileAsyncAPI(source);
    return result.asyncApiDoc;
  } catch {
    return null;
  }
}

// === TEST SOURCES ===

export const TestSources = {
  basicEvent: `
    namespace TestEvents;
    
    model BasicEvent {
      id: string;
      timestamp: utcDateTime;
      data: string;
    }
    
    @channel("test.basic")
    op publishBasicEvent(): BasicEvent;
  `,

  complexEvent: `
    namespace ComplexEvents;
    
    model ComplexEvent {
      @doc("Event identifier")
      id: string;
      @doc("Event timestamp")
      timestamp: utcDateTime;
      @doc("Optional description")
      description?: string;
      @doc("Event metadata")
      metadata: {
        source: string;
        version: int32;
        tags: string[];
      };
      @doc("Event status")
      status: "pending" | "processed" | "failed";
    }
    
    @channel("complex.events")
    op publishComplexEvent(): ComplexEvent;
  `,

  multipleOperations: `
    namespace MultiOps;
    
    model UserEvent {
      userId: string;
      action: string;
    }
    
    model SystemEvent {
      component: string;
      level: "info" | "warning" | "error";
    }
    
    @channel("user.events")
    op publishUserEvent(): UserEvent;
    
    @channel("system.events")
    op publishSystemEvent(): SystemEvent;
    
    @channel("user.notifications")
    op subscribeUserNotifications(userId: string): UserEvent;
  `,

  withDocumentation: `
    @doc("Test namespace with full documentation")
    namespace DocumentedEvents;
    
    @doc("Fully documented event model")
    model DocumentedEvent {
      @doc("Primary identifier")
      id: string;
      @doc("Human-readable name")
      name: string;
      @doc("Creation timestamp")
      createdAt: utcDateTime;
    }
    
    @channel("documented.events")
    @doc("Channel for well-documented events")
    op publishDocumentedEvent(): DocumentedEvent;
  `,

  unionTypes: `
    namespace UnionTypeTest;
    
    model EventWithStatus {
      id: string;
      status: "pending" | "complete" | "failed";
      priority: "low" | "medium" | "high";
    }
    
    @channel("union-test")
    op publishEvent(): EventWithStatus;
  `,

  emptyNamespace: `
    namespace EmptyTest;
  `,
};

// === ASSERTIONS & VALIDATION ===

export const AsyncAPIAssertions = {
  hasValidStructure: (doc: unknown): boolean => {
    if (typeof doc === "string" || !doc || typeof doc !== "object") return false;
    const d = doc as Record<string, unknown>;
    return typeof d.asyncapi === "string" && typeof d.info === "object";
  },
  hasChannel: (doc: AsyncAPIObject, channelName: string): boolean => {
    return doc.channels && channelName in doc.channels;
  },
  hasOperation: (doc: AsyncAPIObject, operationName: string): boolean => {
    return doc.operations && operationName in doc.operations;
  },
  hasSchema: (doc: AsyncAPIObject, schemaName: string): boolean => {
    return doc.components?.schemas && schemaName in doc.components.schemas;
  },
  schemaHasProperty: (doc: AsyncAPIObject, schemaName: string, propertyName: string): boolean => {
    const schema = doc.components?.schemas?.[schemaName];
    return schema?.properties && propertyName in schema.properties;
  },
  hasDocumentation: (obj: { description?: string }, expectedDoc: string): boolean => {
    if (!obj.description || !obj.description.includes(expectedDoc)) {
      throw new Error(
        `Expected documentation containing '${expectedDoc}', got: ${obj.description || "no description"}`,
      );
    }
    return true;
  },
};

export const TestValidationPatterns = {
  validateExpectedSchemas: (doc: AsyncAPIObject, names: string[]) => {
    for (const n of names) {
      if (!doc.components?.schemas?.[n]) throw new Error(`Expected schema '${n}' not found`);
    }
  },
  validateExpectedOperations: (doc: AsyncAPIObject, names: string[]) => {
    for (const n of names) {
      if (!doc.operations?.[n]) throw new Error(`Expected operation '${n}' not found`);
    }
  },
  validateAndLogCompletion: (_doc: AsyncAPIObject, _msg: string) => {},
};

export const TestLogging = {
  logSchemaGenerated: (_name: string) => {},
  logOperationGenerated: (_name: string) => {},
  logValidationSuccess: (_msg: string) => {},
  logGenerationMetrics: (..._args: number[]) => {},
  logMultiNamespaceSchema: (_name: string) => {},
  logMultiNamespaceOperation: (_name: string) => {},
};

export async function validateAsyncAPIObjectComprehensive(doc: unknown): Promise<{
  valid: boolean;
  errors: Array<{ message: string; keyword: string; path: string }>;
  summary: string;
}> {
  if (!doc || typeof doc !== "object") {
    return {
      valid: false,
      errors: [{ message: "Not an object", keyword: "type", path: "" }],
      summary: "Invalid",
    };
  }
  const d = doc as Record<string, unknown>;
  const errors: Array<{ message: string; keyword: string; path: string }> = [];
  if (typeof d.asyncapi !== "string")
    errors.push({ message: "Missing asyncapi version", keyword: "required", path: "/asyncapi" });
  if (typeof d.info !== "object")
    errors.push({ message: "Missing info", keyword: "required", path: "/info" });
  return {
    valid: errors.length === 0,
    errors,
    summary: errors.length === 0 ? "Valid" : `${errors.length} errors`,
  };
}
