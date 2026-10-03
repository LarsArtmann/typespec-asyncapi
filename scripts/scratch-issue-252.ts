// Repro for issue #252: mixing @typespec/openapi3 with this emitter.
import { NodeHost, compile } from "@typespec/compiler";
import { resolve as resolvePath } from "node:path";

const baseDir = resolvePath(import.meta.dirname, "issue-252");
const userSpec = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

model HealthcheckPong {
  status: string;
}

model Response {
  payload: string;
}

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
@route("/api/v1")
namespace Service.Backend;

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
  op moduleOperation(): Response;
}
`;

// Variant B: REST ops added under the same routed parent (what the user's monolith wants).
const userSpecWithRest = userSpec.replace(
  `namespace Service.Backend.Module {
  @subscribe
  op moduleOperation(): Response;
}`,
  `namespace Service.Backend.Module {
  @get
  op getThing(): Response;

  @subscribe
  op moduleOperation(): Response;
}`,
);

// Variant C: recommended split — REST branch under @route, events branch without HTTP context.
const splitSpec = `
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

model HealthcheckPong {
  status: string;
}

model Response {
  payload: string;
}

@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
namespace Service.Backend;

@route("/api/v1")
namespace Service.Backend.Rest {
  @get
  op getThing(): Response;
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
    op moduleOperation(): Response;
  }
}
`;

const cases = [
  ["user-original", userSpec],
  ["user-with-rest", userSpecWithRest],
  ["split-namespaces", splitSpec],
];

for (const [name, source] of cases) {
  const dir = resolvePath(baseDir, name);
  await NodeHost.mkdirp(dir);
  await NodeHost.writeFile(resolvePath(dir, "main.tsp"), source, "utf8");

  for (const emitters of [
    { "@typespec/openapi3": { "emitter-output-dir": "./rest" }, "@lars-artmann/typespec-asyncapi": { "emitter-output-dir": "./websocket" } },
    { "@lars-artmann/typespec-asyncapi": { "emitter-output-dir": "./websocket" } },
  ]) {
    const mode = Object.keys(emitters).length === 2 ? "both" : "asyncapi-only";
    const outDir = resolvePath(dir, mode);
    const program = await compile(NodeHost, resolvePath(dir, "main.tsp"), {
      emitters,
      outputDir: outDir,
      noEmit: false,
    });
    const relevant = program.diagnostics.filter(
      (d) => d.severity === "error" || d.severity === "warning",
    );
    console.log(`\n=== ${name} [${mode}] — ${relevant.length} error/warning diagnostics ===`);
    for (const d of relevant) {
      console.log(`  ${d.severity} ${d.code} — ${d.message}`);
    }
  }
}
