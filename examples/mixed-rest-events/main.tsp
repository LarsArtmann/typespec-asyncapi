import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

// Ambient file namespace: everything below lives in Service.Backend.
// The blockless declaration must come first in the file.
namespace Service.Backend;

// Shared payload models used by both the REST and the event branches.
model HealthcheckPong {
  status: string;
  latencyMs: int32;
}

namespace Module {
  model OrderCreated {
    orderId: string;
    createdAt: string;
  }
}

// REST branch: the @service namespace contains ONLY routed operations, so
// @typespec/http never routes the event operations below.
@service(#{title: "Backend"})
@TypeSpec.Http.server("https://my.service.io", "Production")
@route("/api/v1")
namespace Rest {
  @get
  op getHealth(): HealthcheckPong;

  @post
  op createOrder(body: Module.OrderCreated): Module.OrderCreated;
}

// Events branch: a sibling namespace OUTSIDE the @service subtree. The
// AsyncAPI server lives here; operations stay invisible to HTTP routing.
@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
  pathname: "/api/v1/socket",
})
namespace Events {
  @subscribe
  @channel("health/pong")
  op receivePing(): HealthcheckPong;

  namespace Module {
    @publish
    @channel("orders/created")
    op orderCreated(): Module.OrderCreated;
  }
}
