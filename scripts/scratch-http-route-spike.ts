// TEMPORARY spike probe for M02 — delete after facts are recorded.
// Dumps @typespec/http route facts for a reporter-shaped mixed spec:
// 1. dynamic import("@typespec/http") resolution from this package
// 2. getAllHttpServices(program) route table (verb + path per op)
// 3. raw decorator state via globally-registered symbols
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";
import type { Program, Operation } from "@typespec/compiler";

const packageRoot = await findTestPackageRoot(import.meta.url);
const tester = createTester(packageRoot, {
  libraries: [
    "@lars-artmann/typespec-asyncapi",
    "@typespec/http",
    "@typespec/versioning",
  ],
})
  .import("@typespec/versioning")
  .import("@typespec/http")
  .using("TypeSpec.AsyncAPI");

const source = `
  import "@typespec/http";
  import "@lars-artmann/typespec-asyncapi";

  using TypeSpec.Http;
  using TypeSpec.AsyncAPI;

  @service(#{title: "Backend"})
  @TypeSpec.Http.server("https://my.service.io", "Production")
  @route("/api/v1")
  namespace Service.Backend;

  model HealthcheckPong { status: string; }

  @TypeSpec.AsyncAPI.server("Production", #{
    url: "my.service.io",
    protocol: "wss",
    pathname: "/api/v1/socket",
  })
  namespace Service.Backend {
    @subscribe
    op receivePing(): HealthcheckPong;
  }

  @get
  op explicitGet(): string;

  op verbLessWithBody(#{ @body body: string }): string;

  @route("/custom")
  op routedNoVerb(): string;
`;

const [result, diagnostics] = await tester.compileAndDiagnose(source);
const program: Program = result.program;

console.log("=== diagnostics ===");
for (const d of diagnostics) {
  console.log(`  ${d.severity} ${d.code}: ${d.message}`);
}

console.log("\n=== 1. dynamic import from this package ===");
let httpModule: unknown;
try {
  httpModule = await import("@typespec/http");
  console.log("  import OK, exports:", Object.keys(httpModule as object).filter((k) =>
    /service|operations|route/i.test(k),
  ));
} catch (error) {
  console.log("  import FAILED:", error instanceof Error ? error.message : error);
}

console.log("\n=== 2. getAllHttpServices route table ===");
if (httpModule) {
  const { getAllHttpServices } = httpModule as {
    getAllHttpServices: (
      p: Program,
    ) => [unknown[], { length: number }[]];
  };
  const [services] = getAllHttpServices(program);
  for (const service of services as {
    namespace: { name: string };
    operations: {
      operation: Operation;
      verb: string;
      path: string;
      uriTemplate: string;
    }[];
  }[]) {
    console.log(`  service: ${service.namespace.name}`);
    for (const op of service.operations) {
      console.log(
        `    op=${op.operation.name} verb=${op.verb} path=${op.path} uri=${op.uriTemplate}`,
      );
    }
  }
}

console.log("\n=== 3. raw decorator state via Symbol.for ===");
for (const key of ["routes", "verbs", "sharedRoutes"]) {
  const symbol = Symbol.for(`@typespec/http/${key}`);
  const map = program.stateMap(symbol);
  const entries: string[] = [];
  let count = 0;
  for (const [type, value] of map) {
    count++;
    if (entries.length < 8) {
      const name = "name" in type ? String(type.name) : type.kind;
      entries.push(`    ${type.kind} ${name} = ${JSON.stringify(value)}`);
    }
  }
  console.log(`  ${key}: ${count} entries`);
  for (const entry of entries) {
    console.log(entry);
  }
}

console.log("\n=== 4. isHttpLibraryLoaded check ===");
const globalNs = program.getGlobalNamespaceType();
const typeSpecNs = globalNs.namespaces.get("TypeSpec");
console.log("  TypeSpec.Http namespace present:", typeSpecNs?.namespaces.has("Http") ?? false);
