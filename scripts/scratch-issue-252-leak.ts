// Scratch: verify (a) bare-op leak of REST ops into AsyncAPI doc, (b) library detection API.
import { execFileSync } from "node:child_process";
import { resolve as resolvePath } from "node:path";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync, symlinkSync, rmSync } from "node:fs";

const baseDir = resolvePath(import.meta.dirname, "issue-252-leak");
const repoRoot = resolvePath(baseDir, "../..");
const tspBin = resolvePath(repoRoot, "node_modules/.bin/tsp");

// No ambient namespace: Rest and Events are DIRECT children of global.
const leakSpec = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

model ModuleResponse {
  payload: string;
}

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
namespace Rest {
  @route("/api/v1")
  @get
  op getThing(): ModuleResponse;
}

@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Events {
  @subscribe
  op receivePing(): ModuleResponse;
}
`;

const tspconfig = `kind: project
emit:
  - "@typespec/openapi3"
  - "@lars-artmann/typespec-asyncapi"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{output-dir}/rest"
    openapi-versions:
      - 3.1.0
  "@lars-artmann/typespec-asyncapi":
    emitter-output-dir: "{output-dir}/websocket"
`;

const dir = resolvePath(baseDir, "leak");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(resolvePath(dir, "main.tsp"), leakSpec, "utf8");
writeFileSync(resolvePath(dir, "tspconfig.yaml"), tspconfig, "utf8");
symlinkSync(resolvePath(repoRoot, "node_modules"), resolvePath(dir, "node_modules"));

console.log("=== leak-test (Rest + Events as direct global children, no ambient ns) ===");
try {
  execFileSync(tspBin, ["compile", "."], { cwd: dir, encoding: "utf8", stdio: "pipe" });
  console.log("  compile: OK");
} catch (error) {
  console.log(String((error as { stdout?: string }).stdout ?? ""));
}
const outDir = resolvePath(dir, "tsp-output");
if (existsSync(outDir)) {
  for (const f of readdirSync(outDir, { recursive: true })) {
    if (!String(f).endsWith(".yaml")) continue;
    const content = readFileSync(resolvePath(outDir, String(f)), "utf8");
    const keys = [...content.matchAll(/^  ([A-Za-z0-9_.\/{}-]+):/gm)].map((m) => m[1]);
    console.log(`  ${f}: top-level-ish keys=${JSON.stringify(keys.slice(0, 12))}`);
  }
}
