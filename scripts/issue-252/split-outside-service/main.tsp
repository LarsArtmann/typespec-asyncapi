
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
