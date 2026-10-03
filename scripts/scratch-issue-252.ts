// Repro for issue #252: mixing @typespec/openapi3 with this emitter.
import { NodeHost, compile } from "@typespec/compiler";
import { resolve as resolvePath } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const baseDir = resolvePath(import.meta.dirname, "issue-252");
const userSpec = `
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

// Variant B: REST op added under the same routed parent (what the user's monolith wants).
const userSpecWithRest = userSpec.replace(
  `namespace Service.Backend.Module {
  @subscribe
  op moduleOperation(): ModuleResponse;
}`,
  `namespace Service.Backend.Module {
  @get
  op getThing(): ModuleResponse;

  @subscribe
  op moduleOperation(): ModuleResponse;
}`,
);

// Variant C: recommended split — REST branch under @route, events branch without HTTP context.
const splitSpec = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
namespace Service.Backend;

model HealthcheckPong {
  status: string;
}

model ModuleResponse {
  payload: string;
}

@route("/api/v1")
namespace Service.Backend.Rest {
  @get
  op getThing(): ModuleResponse;
}

@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Service.Backend.Events {
  @subscribe
  op receivePing(): HealthcheckPong;

  namespace Module {
    @subscribe
    op moduleOperation(): ModuleResponse;
  }
}
`;

// Variant D: events moved OUT of the @service namespace entirely (sibling branch).
const splitOutsideSpec = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
namespace Service.Backend;

model HealthcheckPong {
  status: string;
}

model ModuleResponse {
  payload: string;
}

@route("/api/v1")
namespace Service.Backend.Rest {
  @get
  op getThing(): ModuleResponse;
}

@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Service.BackendEvents {
  @subscribe
  op receivePing(): HealthcheckPong;

  namespace Module {
    @subscribe
    op moduleOperation(): ModuleResponse;
  }
}
`;

const cases: Array<[string, string]> = [
  ["user-original", userSpec],
  ["user-with-rest", userSpecWithRest],
  ["split-namespaces", splitSpec],
  ["split-outside-service", splitOutsideSpec],
];

const modes: Array<[string, string[], Record<string, unknown>]> = [
  [
    "no-emitters",
    [],
    {},
  ],
  [
    "openapi3-only",
    ["@typespec/openapi3"],
    { "@typespec/openapi3": { "emitter-output-dir": "./rest" } },
  ],
  [
    "asyncapi-only",
    ["@lars-artmann/typespec-asyncapi"],
    { "@lars-artmann/typespec-asyncapi": { "emitter-output-dir": "./websocket" } },
  ],
  [
    "both",
    ["@typespec/openapi3", "@lars-artmann/typespec-asyncapi"],
    {
      "@typespec/openapi3": { "emitter-output-dir": "./rest" },
      "@lars-artmann/typespec-asyncapi": { "emitter-output-dir": "./websocket" },
    },
  ],
];

for (const [name, source] of cases) {
  const dir = resolvePath(baseDir, name);
  await NodeHost.mkdirp(dir);
  await NodeHost.writeFile(resolvePath(dir, "main.tsp"), source, "utf8");

  for (const [mode, emit, options] of modes) {
    const outDir = resolvePath(dir, mode);
    const program = await compile(NodeHost, resolvePath(dir, "main.tsp"), {
      emit,
      options,
      outputDir: outDir,
      noEmit: emit.length === 0 ? true : false,
    });
    const relevant = program.diagnostics.filter(
      (d) => d.severity === "error" || d.severity === "warning",
    );
    console.log(`\n=== ${name} [${mode}] — ${relevant.length} error/warning diagnostics ===`);
    for (const d of relevant) {
      console.log(`  ${d.severity} ${d.code} — ${d.message}`);
    }
    if (existsSync(outDir)) {
      const files = readdirSync(outDir, { recursive: true }).filter((f) => String(f).endsWith((".json" as string).toString()) || String(f).endsWith(".yaml"));
      for (const f of files) {
        const content = readFileSync(resolvePath(outDir, String(f)), "utf8");
        const summary = summarize(content);
        console.log(`  output ${f}: ${summary}`);
      }
    }
  }
}

function summarize(content: string): string {
  const paths: string[] = [];
  const channels: string[] = [];
  for (const m of content.matchAll(/^  (\/[^:\s]*):/gm)) paths.push(m[1]);
  for (const m of content.matchAll(/^    ([A-Za-z0-9_.\/{}]+): \{/gm)) channels.push(m[1]);
  const opIds = [...content.matchAll(/operationId: (\w+)/g)].map((m) => m[1]);
  return `paths=[${paths.join(",")}] channels=[${channels.join(",")}] operationIds=[${opIds.join(",")}]`;
}
