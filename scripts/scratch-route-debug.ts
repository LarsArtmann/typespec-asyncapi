// TEMPORARY debug for failing unit test — delete with the spike.
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";
import { loadHttpRouteFacts } from "../src/builders/http-route-facts.js";

const packageRoot = await findTestPackageRoot(import.meta.url);
const tester = createTester(packageRoot, {
  libraries: [
    "@lars-artmann/typespec-asyncapi",
    "@typespec/http",
    "@typespec/versioning",
  ],
})
  .importLibraries()
  .using("TypeSpec.AsyncAPI");

const source = `
  import "@typespec/http";
  @service(#{title: "Backend"})
  namespace Service {
    op verblessNoBody(): string;
  }
`;

const [result, diagnostics] = await tester.compileAndDiagnose(source);
console.log("diagnostics:", diagnostics.map((d) => `${d.severity} ${d.code}: ${d.message}`));
const facts = await loadHttpRouteFacts(result.program);
console.log("facts:", facts ? [...facts.routes.entries()].map(([op, r]) => [op.name, r]) : "undefined");
