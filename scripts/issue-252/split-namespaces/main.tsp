
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
