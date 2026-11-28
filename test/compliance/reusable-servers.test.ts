/**
 * Reusable server definitions compliance.
 *
 * `@reusableServer` populates `components.servers`; `@useChannelServer`
 * resolves the name against `components.servers` first (the AsyncAPI 3.1
 * channel-servers target) and falls back to root servers for backward
 * compatibility.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { inlineObject } from "../utils/type-guards.js";

describe("reusable servers", () => {
  it("emits components.servers and channels reference them", async () => {
    const doc = await compileAndValidateOrThrow(`
      using TypeSpec.AsyncAPI;

      @reusableServer("prod", #{
        url: "mqtt://broker.example.com:{port}",
        protocol: "mqtt",
        variables: #{ port: #{ default: "8883", values: #["8883", "1883"] } }
      })
      namespace Demo;

      model OrderPlaced {
        orderId: string;
      }

      @channel("orders", "orders-channel")
      @useChannelServer("prod")
      @publish
      op placeOrder(): OrderPlaced;
    `);

    const prod = inlineObject(doc.components?.servers?.prod, "prod server");
    expect(prod.host).toBe("mqtt://broker.example.com:{port}");
    expect(prod.protocol).toBe("mqtt");
    expect(doc.channels["orders-channel"].servers).toStrictEqual([
      { $ref: "#/components/servers/prod" },
    ]);
  });

  it("keeps root-server refs when only @server defines the name", async () => {
    const doc = await compileAndValidateOrThrow(`
      using TypeSpec.AsyncAPI;

      @server("dev", #{ url: "amqp://localhost:5672", protocol: "amqp" })
      namespace Demo;

      model EventReceived {
        eventId: string;
      }

      @channel("events", "events-channel")
      @useChannelServer("dev")
      @subscribe
      op onEvent(): EventReceived;
    `);

    expect(doc.components?.servers).toBeUndefined();
    expect(doc.servers?.dev).toBeDefined();
    expect(doc.channels["events-channel"].servers).toStrictEqual([
      { $ref: "#/servers/dev" },
    ]);
  });
});
