// TEMPORARY debug — why no bare-op-assumed-rest? Delete with the spike.
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";

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

  model Pong { status: string; }

  @service(#{title: "Backend"})
  @TypeSpec.Http.server("https://my.service.io", "Production")
  namespace Rest {
    op getThing(): Pong;
  }

  @TypeSpec.AsyncAPI.server("Production", #{
    url: "my.service.io",
    protocol: "wss",
  })
  namespace Events {
    @subscribe
    op receivePing(): Pong;
  }
`;

const [result, diagnostics] = await tester.compileAndDiagnose(source);
console.log("diagnostics:");
for (const d of diagnostics) {
  console.log(`  ${d.severity} ${d.code}: ${d.message.slice(0, 120)}`);
}
const fs = (result as { fs?: { fs?: Map<string, string> } }).fs?.fs;
if (fs) {
  for (const [path, content] of fs) {
    if (path.includes("node_modules")) continue;
    if (path.endsWith(".yaml") || path.endsWith(".json")) {
      console.log(`OUTPUT ${path}:`);
      console.log(content.slice(0, 600));
    }
  }
}
