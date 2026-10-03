// TEMPORARY: upstream evidence matrix for microsoft/typespec — http-only.
// Proves verb-less routing behavior WITHOUT our emitter in the program.
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";

const packageRoot = await findTestPackageRoot(import.meta.url);
const tester = createTester(packageRoot, {
  libraries: ["@typespec/http", "@typespec/openapi3", "@typespec/rest"],
})
  .importLibraries()
  .using("TypeSpec.Http");

const source = `
  @service(#{title: "Repro"})
  namespace Demo {
    @route("/explicit-get")
    @get op explicitGet(): string;

    @route("/explicit-post")
    @post op explicitPost(): string;

    @route("/verbless-no-body")
    op verblessNoBody(): string;

    @route("/verbless-with-body")
    op verblessWithBody(@body body: string): string;

    @route("/verbless-query-only")
    op verblessQueryOnly(@query query: string): string;
  }

  op outsideAnyService(): string;
`;

const [result, diagnostics] = await tester.compileAndDiagnose(source);
console.log("=== diagnostics ===");
for (const d of diagnostics) {
  console.log(`  ${d.severity} ${d.code}: ${d.message.slice(0, 120)}`);
}

// Dump the resolved route table via the http library directly.
const http = await import("@typespec/http");
const [services] = http.getAllHttpServices(result.program);
console.log("=== resolved route table (http-only program) ===");
for (const service of services) {
  console.log(`service: ${service.namespace.name}`);
  for (const op of service.operations) {
    console.log(
      `  ${op.verb.toUpperCase().padEnd(5)} ${op.path}  (${op.operation.name})`,
    );
  }
}
