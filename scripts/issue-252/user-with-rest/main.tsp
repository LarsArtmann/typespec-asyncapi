
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
  @get
  op getThing(): Response;

  @subscribe
  op moduleOperation(): Response;
}
