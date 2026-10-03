// Verbatim structure of the user report in
// https://github.com/LarsArtmann/typespec-asyncapi/issues/252
// (mixed @typespec/http + AsyncAPI in one program).
// Model bodies the issue elided with "{...}" are filled in.
// Both @subscribe ops land inside the @route("/api/v1") service namespace;
// @typespec/http routes them as GET /api/v1 and raises duplicate-operation
// errors on top of the AsyncAPI event usage.
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

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
  model HealthcheckPong {
    status: string;
  }

  @subscribe
  op receivePing(): HealthcheckPong;
}

namespace Service.Backend.Module {
  model Response {
    payload: string;
  }

  @subscribe
  op moduleOperation(): Response;
}
