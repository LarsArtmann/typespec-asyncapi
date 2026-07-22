/**
 * AsyncAPI 3.1.0 Spec Compliance: Document Structure
 *
 * Validates that emitter output conforms to the mandatory top-level
 * structure of the AsyncAPI 3.1.0 specification.
 *
 * Spec reference: https://www.asyncapi.com/docs/reference/specification/v3.1.0
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: Document Structure", () => {
  it("emits asyncapi version 3.1.0", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.asyncapi).toBe("3.1.0");
  });

  it("emits required info object with title and version", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const info = doc.info as Record<string, unknown>;
    expect(info).toBeDefined();
    expect(info.title).toBeTypeOf("string");
    expect(info.version).toBeTypeOf("string");
  });

  it("emits channels map (required field)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    expect(doc.channels).toBeTypeOf("object");
  });

  it("channel has address field matching decorator path", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("user.events.created")
      op publish(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const channel = channels["user.events.created"];
    expect(channel).toBeDefined();
    expect(channel.address).toBe("user.events.created");
  });

  it("channel messages use $ref to components/messages", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model UserEvent { id: string; name: string; }
      @channel("users")
      op publish(): UserEvent;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const channel = channels["users"];
    const messages = channel.messages as Record<string, { $ref: string }>;
    expect(messages).toBeDefined();
    expect(messages.UserEvent).toBeDefined();
    expect(messages.UserEvent.$ref).toBe("#/components/messages/UserEvent");
  });

  it("operations have required action and channel fields", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publishEvent(): Event;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    const op = operations.publishEvent;
    expect(op).toBeDefined();
    expect(op.action).toBe("send");
    expect(op.channel).toStrictEqual({ $ref: "#/channels/events" });
  });

  it("components.messages contain payload $ref to schemas", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model OrderEvent { orderId: string; }
      @channel("orders")
      op publishOrder(): OrderEvent;
    `);

    const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
    const msg = components.messages.OrderEvent;
    expect(msg).toBeDefined();
    expect(msg.name).toBe("OrderEvent");
    expect(msg.contentType).toBe("application/json");
    expect(msg.payload).toStrictEqual({
      $ref: "#/components/schemas/OrderEvent",
    });
  });

  it("components.schemas contain typed properties", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model MyEvent {
        id: string;
        count: int32;
        active: boolean;
      }
      @channel("events")
      op publish(): MyEvent;
    `);

    const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
    const schema = components.schemas.MyEvent;
    expect(schema.type).toBe("object");
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.id.type).toBe("string");
    expect(props.count.type).toBe("integer");
    expect(props.active.type).toBe("boolean");
  });

  it("infers action send from publish operation names", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("send-events")
      op publishEvent(): Event;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    expect(operations.publishEvent.action).toBe("send");
  });

  it("infers action receive from subscribe operation names", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("recv-events")
      op subscribeToEvent(): Event;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    expect(operations.subscribeToEvent.action).toBe("receive");
  });

  it("supports multiple channels in a single document", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Created { id: string; }
      model Deleted { id: string; }
      @channel("created")
      op publishCreated(): Created;
      @channel("deleted")
      op publishDeleted(): Deleted;
    `);

    const channels = doc.channels as Record<string, unknown>;
    expect(Object.keys(channels)).toHaveLength(2);
    expect(channels["created"]).toBeDefined();
    expect(channels["deleted"]).toBeDefined();
  });
});
