import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("multi-message operations", () => {
  it("should emit multiple messages for a union return type", async () => {
    const spec = `
      @service(#{title: "Multi-Message Test"})
      @defaultContentType("application/json")
      namespace MultiMessageTest;

      model UserCreated {
        id: string;
        name: string;
      }

      model UserDeleted {
        id: string;
        reason: string;
      }

      @publish
      @channel("user.events")
      op publishUserEvent(): UserCreated | UserDeleted;
    `;

    const doc = await compileAndValidateOrThrow(spec);

    const op = doc.operations?.["publishUserEvent"];
    expect(op).toBeDefined();
    expect(op?.messages).toBeDefined();
    expect(op?.messages).toHaveLength(2);

    const refs = op?.messages?.map((m: { $ref?: string }) => m.$ref);
    expect(refs).toContain(
      "#/channels/user.events/messages/UserCreated",
    );
    expect(refs).toContain(
      "#/channels/user.events/messages/UserDeleted",
    );
  });

  it("should register all union messages in the channel", async () => {
    const spec = `
      @service(#{title: "Channel Messages Test"})
      @defaultContentType("application/json")
      namespace ChannelMessagesTest;

      model OrderPlaced {
        orderId: string;
        total: int32;
      }

      model OrderShipped {
        orderId: string;
        trackingNumber: string;
      }

      @publish
      @channel("orders")
      op publishOrderEvents(): OrderPlaced | OrderShipped;
    `;

    const doc = await compileAndValidateOrThrow(spec);

    const channel = doc.channels?.["orders"];
    expect(channel).toBeDefined();
    expect(channel?.messages).toBeDefined();
    expect(Object.keys(channel?.messages ?? {})).toHaveLength(2);
    expect(channel?.messages).toHaveProperty("OrderPlaced");
    expect(channel?.messages).toHaveProperty("OrderShipped");
  });

  it("should register all message schemas in components", async () => {
    const spec = `
      @service(#{title: "Schema Registration Test"})
      @defaultContentType("application/json")
      namespace SchemaRegistrationTest;

      model EventA {
        value: string;
      }

      model EventB {
        count: int32;
      }

      model EventC {
        active: boolean;
      }

      @publish
      @channel("events")
      op publishEvents(): EventA | EventB | EventC;
    `;

    const doc = await compileAndValidateOrThrow(spec);

    expect(doc.components?.schemas).toHaveProperty("EventA");
    expect(doc.components?.schemas).toHaveProperty("EventB");
    expect(doc.components?.schemas).toHaveProperty("EventC");
  });

  it("should still work with a single return type (backward compatible)", async () => {
    const spec = `
      @service(#{title: "Single Message Test"})
      @defaultContentType("application/json")
      namespace SingleMessageTest;

      model SimpleMessage {
        value: string;
      }

      @publish
      @channel("simple")
      op publishSimple(): SimpleMessage;
    `;

    const doc = await compileAndValidateOrThrow(spec);

    const op = doc.operations?.["publishSimple"];
    expect(op).toBeDefined();
    expect(op?.messages).toHaveLength(1);
    expect(op?.messages?.[0]).toStrictEqual({
      $ref: "#/channels/simple/messages/SimpleMessage",
    });
  });
});
