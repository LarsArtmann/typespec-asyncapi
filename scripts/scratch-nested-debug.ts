// TEMPORARY debug for nested-service warning — delete with the spike.
import { compileAsyncAPI } from "../test/utils/test-helpers.js";

const result = await compileAsyncAPI(`
  import "@typespec/http";
  import "@lars-artmann/typespec-asyncapi";

  using TypeSpec.Http;
  using TypeSpec.AsyncAPI;

  @service(#{title: "Outer"})
  @TypeSpec.Http.server("https://outer.service.io", "Production")
  @route("/outer")
  namespace Service.Outer;

  model Pong {
    status: string;
  }

  @TypeSpec.AsyncAPI.server("Production", #{
    url: "my.service.io",
    protocol: "wss",
    pathname: "/api/v1/socket",
  })
  namespace Service.Outer.Inner {
    @service(#{title: "Inner"})
    @TypeSpec.Http.server("https://inner.service.io", "Production")
    @route("/inner")
    @subscribe
    op receivePing(): Pong;
  }
`);
for (const d of result.diagnostics) {
  console.log(`  ${d.severity} ${d.code}: ${d.message.slice(0, 110)}`);
}
console.log("channels:", Object.keys(result.asyncApiDoc?.channels ?? {}));
console.log("title:", result.asyncApiDoc?.info?.title);
