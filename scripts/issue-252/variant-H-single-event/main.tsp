

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
