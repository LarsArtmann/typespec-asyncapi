/**
 * Decorator Output Tests
 *
 * Verifies that @tags, @correlationId, @header, and @bindings decorators
 * actually produce correct output in the generated AsyncAPI document.
 */

import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers";
import { parse as parseYAML } from "yaml";

async function compileAndGetDoc(source: string) {
  const result = await compileAsyncAPISpecWithoutErrors(source);
  for (const [, content] of result.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      return parseYAML(content);
    }
  }
  throw new Error("No AsyncAPI output found");
}

describe("decorator Output: @tags", () => {
  it("should emit tags on operations", async () => {
    const doc = await compileAndGetDoc(`
      @tags(#["users", "events"])
      @channel("user.events")
      @publish
      op publishUserEvent(): UserEvent;

      model UserEvent { id: string; }
    `);

    const op = doc.operations?.publishUserEvent;
    expect(op).toBeDefined();
    expect(op.tags).toBeDefined();
    expect(op.tags).toHaveLength(2);
    expect(op.tags[0].name).toBe("users");
    expect(op.tags[1].name).toBe("events");
  });

  it("should emit tags on models", async () => {
    const doc = await compileAndGetDoc(`
      @tags(#["important"])
      model OrderEvent {
        orderId: string;
      }

      @channel("orders")
      @publish
      op publishOrder(): OrderEvent;
    `);

    const msg = doc.components?.messages?.OrderEvent;
    expect(msg).toBeDefined();
    expect(msg.tags).toBeDefined();
    expect(msg.tags[0].name).toBe("important");
  });
});

describe("decorator Output: @correlationId", () => {
  it("should emit correlationId on messages", async () => {
    const doc = await compileAndGetDoc(`
      @correlationId("$message.header#/correlationId")
      model TrackedEvent {
        eventId: string;
        data: string;
      }

      @channel("tracked.events")
      @publish
      op publishTrackedEvent(): TrackedEvent;
    `);

    const msg = doc.components?.messages?.TrackedEvent;
    expect(msg).toBeDefined();
    expect(msg.correlationId).toBeDefined();
    expect(msg.correlationId.location).toBe("$message.header#/correlationId");
  });
});

describe("decorator Output: @header", () => {
  it("should emit headers schema on messages", async () => {
    const doc = await compileAndGetDoc(`
      @header("x-request-id", "string")
      model ApiEvent {
        payload: string;
      }

      @channel("api.events")
      @publish
      op publishApiEvent(): ApiEvent;
    `);

    const msg = doc.components?.messages?.ApiEvent;
    expect(msg).toBeDefined();
    expect(msg.headers).toBeDefined();
    expect(msg.headers.type).toBe("object");
    expect(msg.headers.properties).toBeDefined();
    expect(msg.headers.properties["x-request-id"]).toBeDefined();
  });
});

describe("decorator Output: @bindings", () => {
  it("should emit bindings on operations", async () => {
    const doc = await compileAndGetDoc(`
      @bindings(#{
        kafka: #{
          clientId: "test-client"
        }
      })
      @channel("kafka.events")
      @publish
      op publishKafkaEvent(): KafkaEvent;

      model KafkaEvent { id: string; }
    `);

    const op = doc.operations?.publishKafkaEvent;
    expect(op).toBeDefined();
    expect(op.bindings).toBeDefined();
    expect(op.bindings.kafka).toBeDefined();
    expect(op.bindings.kafka.clientId).toBe("test-client");
  });

  it("should emit bindings on messages", async () => {
    const doc = await compileAndGetDoc(`
      @bindings(#{
        kafka: #{
          key: "orderId"
        }
      })
      model OrderMessage {
        orderId: string;
      }

      @channel("orders")
      @publish
      op publishOrder(): OrderMessage;
    `);

    const msg = doc.components?.messages?.OrderMessage;
    expect(msg).toBeDefined();
    expect(msg.bindings).toBeDefined();
    expect(msg.bindings.kafka).toBeDefined();
    expect(msg.bindings.kafka.key).toBe("orderId");
  });
});

describe("decorator Output: @server with variables", () => {
  it("should emit server variables for {var} in host", async () => {
    const doc = await compileAndGetDoc(`
      @server("prod", #{
        url: "{region}.example.com",
        protocol: "https"
      })
      namespace TestServer;

      model Event { id: string; }

      @channel("events")
      @publish
      op publish(): Event;
    `);

    expect(doc.servers?.prod).toBeDefined();
    expect(doc.servers.prod.host).toBe("{region}.example.com");
    expect(doc.servers.prod.variables).toBeDefined();
    expect(doc.servers.prod.variables.region).toBeDefined();
  });
});

describe("decorator Output: channel parameters", () => {
  it("should emit channel parameters for {var} in address", async () => {
    const doc = await compileAndGetDoc(`
      model UserEvent { id: string; }

      @channel("users/{userId}/events")
      @publish
      op publishUserEvent(): UserEvent;
    `);

    const channel = doc.channels?.["users/{userId}/events"];
    expect(channel).toBeDefined();
    expect(channel.parameters).toBeDefined();
    expect(channel.parameters.userId).toBeDefined();
  });
});
