// Repro v3 for issue #252 — use the real tsp CLI per variant, like the user does.
import { execFileSync } from "node:child_process";
import { resolve as resolvePath } from "node:path";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync, symlinkSync, rmSync } from "node:fs";

const baseDir = resolvePath(import.meta.dirname, "issue-252");
const repoRoot = resolvePath(baseDir, "../..");
const tspBin = resolvePath(repoRoot, "node_modules/.bin/tsp");

const header = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

namespace Service.Backend;

model HealthcheckPong {
  status: string;
}

model ModuleResponse {
  payload: string;
}
`;

// Variant E: @service on ROOT sub-namespace covering Rest+Events (events inside service subtree).
const variantE = `
${header}
@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
namespace Root {
  namespace Rest {
    @route("/api/v1")
    @get
    op getThing(): ModuleResponse;
  }
}

@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Events {
  @subscribe
  op receivePing(): HealthcheckPong;

  namespace Module {
    @subscribe
    op moduleOperation(): ModuleResponse;
  }
}
`;

// Variant F: @service on the REST sub-namespace only; Events outside the service subtree.
const variantF = `
${header}
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
  op receivePing(): HealthcheckPong;

  namespace Module {
    @subscribe
    op moduleOperation(): ModuleResponse;
  }
}
`;

// Variant H: user's "worked so far" state — ONE event op under the routed service.
const variantH = `
${header}
@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
@route("/api/v1")
namespace Routed {
  @TypeSpec.AsyncAPI.server("Production", #{
    url: "my.service.io",
    protocol: "wss",
    pathname: "/api/v1/socket",
  })
  namespace Events {
    @subscribe
    op receivePing(): HealthcheckPong;
  }
}
`;

// Variant I: user's ORIGINAL structure, faithfully (relative-nesting trap included).
const variantI = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
@route("/api/v1")
namespace Service.Backend;

model HealthcheckPong {
  status: string;
}

model ModuleResponse {
  payload: string;
}

@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Service.Backend {
  @subscribe
  op receivePing(): HealthcheckPong;
}

namespace Service.Backend.Module {
  @subscribe
  op moduleOperation(): ModuleResponse;
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

const cases: [string, string][] = [
  ["variant-E-service-on-root", variantE],
  ["variant-F-service-on-rest", variantF],
  ["variant-H-single-event", variantH],
  ["variant-I-user-original", variantI],
];

for (const [name, source] of cases) {
  const dir = resolvePath(baseDir, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolvePath(dir, "main.tsp"), source, "utf8");
  writeFileSync(resolvePath(dir, "tspconfig.yaml"), tspconfig, "utf8");
  symlinkSync(resolvePath(repoRoot, "node_modules"), resolvePath(dir, "node_modules"));

  console.log(`\n=== ${name} ===`);
  try {
    execFileSync(tspBin, ["compile", "."], { cwd: dir, encoding: "utf8", stdio: "pipe" });
    console.log("  compile: OK");
  } catch (err) {
    const out = String(err.stdout ?? "") + String(err.stderr ?? "");
    console.log(out.trimEnd());
  }
  const outDir = resolvePath(dir, "tsp-output");
  if (existsSync(outDir)) {
    for (const f of readdirSync(outDir, { recursive: true })) {
      const p = resolvePath(outDir, String(f));
      if (!String(f).endsWith(".json")) continue;
      const doc = JSON.parse(readFileSync(p, "utf8"));
      if (doc.paths) {
        console.log(`  rest/${f}: paths=${JSON.stringify(Object.keys(doc.paths))}`);
      }
      if (doc.channels) {
        console.log(`  websocket/${f}: channels=${JSON.stringify(Object.keys(doc.channels))} servers=${JSON.stringify(Object.keys(doc.servers ?? {}))} title=${JSON.stringify(doc.info?.title)}`);
      }
    }
  }
}
