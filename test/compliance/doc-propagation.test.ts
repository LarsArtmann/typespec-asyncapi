/**
 * AsyncAPI 3.1.0 Spec Compliance: @doc and @summary propagation
 *
 * Validates that @doc on channel-decorated operations produces
 * channel descriptions, and @summary produces operation/channel summaries.
 * All output validates against the AsyncAPI 3.1.0 JSON Schema.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: @doc propagation", () => {
  it("propagates @doc to channel description", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("User lifecycle events")
      @channel("users.events")
      @publish
      op publishUserEvent(): UserEvent;

      model UserEvent { id: string; }
    `);

    const channel = doc.channels?.["users.events"];
    expect(channel).toBeDefined();
    expect(channel?.description).toBe("User lifecycle events");
  });

  it("propagates @doc to operation description", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("Publishes events")
      @channel("events")
      @publish
      op publishEvent(): Event;

      model Event { id: string; }
    `);

    const op = doc.operations?.publishEvent;
    expect(op).toBeDefined();
    expect(op?.description).toBe("Publishes events");
  });

  it("emits valid output with @doc on model", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("A user event message")
      model UserEvent { id: string; }
      @channel("events")
      @publish
      op publishUserEvent(): UserEvent;
    `);

    expect(doc.channels?.events).toBeDefined();
    expect(doc.operations?.publishUserEvent).toBeDefined();
  });

  it("maps @summary on operation to operation summary", async () => {
    const doc = await compileAndValidateOrThrow(`
      @summary("Publish Event Op")
      @channel("events")
      @publish
      op publishEvent(): Event;

      model Event { id: string; }
    `);

    const op = doc.operations?.publishEvent;
    expect(op).toBeDefined();
    expect(op?.summary).toBe("Publish Event Op");
  });

  it("maps @summary on channel-decorated operation to channel summary", async () => {
    const doc = await compileAndValidateOrThrow(`
      @summary("Event Channel")
      @channel("events")
      @publish
      op publishEvent(): Event;

      model Event { id: string; }
    `);

    const channel = doc.channels?.events;
    expect(channel).toBeDefined();
    expect(channel?.summary).toBe("Event Channel");
  });

  it("sets both description and summary when both @doc and @summary are present", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("Detailed operation description")
      @summary("Short Op Summary")
      @channel("events")
      @publish
      op publishEvent(): Event;

      model Event { id: string; }
    `);

    const op = doc.operations?.publishEvent;
    expect(op?.description).toBe("Detailed operation description");
    expect(op?.summary).toBe("Short Op Summary");
  });

  it("maps @message title to message title field", async () => {
    const doc = await compileAndValidateOrThrow(`
      @message(#{title: "Order Created"})
      model OrderCreated { orderId: string; }
      @channel("orders")
      @publish
      op publishOrder(): OrderCreated;
    `);

    const msg = doc.components?.messages?.OrderCreated;
    expect(msg).toBeDefined();
    expect(msg?.title).toBe("Order Created");
  });

  it("sets message title from model name when @message has no explicit title", async () => {
    const doc = await compileAndValidateOrThrow(`
      @message(#{description: "User signup event"})
      model UserSignup { userId: string; }
      @channel("users")
      @publish
      op publishSignup(): UserSignup;
    `);

    const msg = doc.components?.messages?.UserSignup;
    expect(msg).toBeDefined();
    expect(msg?.title).toBe("UserSignup");
  });

  it("sets message title on auto-registered messages without @message decorator", async () => {
    const doc = await compileAndValidateOrThrow(`
      model AutoRegistered { id: string; }
      @channel("events")
      @publish
      op publishEvent(): AutoRegistered;
    `);

    const msg = doc.components?.messages?.AutoRegistered;
    expect(msg).toBeDefined();
    expect(msg?.title).toBe("AutoRegistered");
  });

  it("populates message examples from @example on @message model", async () => {
    const doc = await compileAndValidateOrThrow(`
      @message(#{title: "User Event"})
      @example(#{id: "user-123", name: "Alice"})
      model UserEvent { id: string; name: string; }
      @channel("users")
      @publish
      op publishUser(): UserEvent;
    `);

    const msg = doc.components?.messages?.UserEvent;
    expect(msg?.examples).toBeDefined();
    expect(msg?.examples).toHaveLength(1);
    expect(msg?.examples?.[0]?.payload).toStrictEqual({
      id: "user-123",
      name: "Alice",
    });
  });

  it("propagates @doc and @summary on channel-only operations (no @publish/@subscribe)", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("Channel-only documentation")
      @summary("Channel Summary")
      @channel("events")
      op handleEvents(): Event;

      model Event { id: string; }
    `);

    const channel = doc.channels?.events;
    expect(channel?.description).toBe("Channel-only documentation");
    expect(channel?.summary).toBe("Channel Summary");
  });

  it("works correctly with bare operations (no decorators except namespace)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      op publishEvent(): Event;
    `);

    expect(doc.channels?.publishEvent).toBeDefined();
    expect(doc.operations?.publishEvent).toBeDefined();
  });
});
