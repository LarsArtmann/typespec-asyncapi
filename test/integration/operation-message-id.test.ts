/**
 * Integration Tests: @operationId and @messageId decorators
 *
 * Verifies that custom naming decorators override auto-generated names
 * while maintaining correct $ref chain integrity.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { MessageObject } from "../../src/domain/models/asyncapi-document.js";

describe("integration: @operationId decorator", () => {
  it("overrides the operation key in the output document", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @operationId("custom.publish.event")
      op publishEvent(): Event;
    `);

    expect(doc.operations!["custom.publish.event"]).toBeDefined();
    expect(doc.operations!.publishEvent).toBeUndefined();
    const op = doc.operations!["custom.publish.event"];
    expect(op.action).toBe("send");
    expect(op.channel).toStrictEqual({ $ref: "#/channels/events" });
  });

  it("preserves $ref chain with custom operation ID", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @operationId("evt.publish")
      op publishEvent(): Event;
    `);

    const op = doc.operations!["evt.publish"];
    expect(op.messages).toBeDefined();
    expect(op.messages![0].$ref).toBe("#/channels/events/messages/Event");

    const channel = doc.channels!["events"];
    expect(channel.messages!.Event).toBeDefined();
    expect(channel.messages!.Event.$ref).toBe("#/components/messages/Event");
  });

  it("works with subscribe operations", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @operationId("consume.event")
      op subscribeToEvent(): Event;
    `);

    const op = doc.operations!["consume.event"];
    expect(op).toBeDefined();
    expect(op.action).toBe("receive");
  });
});

describe("integration: @messageId decorator", () => {
  it("overrides the message key in components.messages", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @messageId("user.created.v2")
      model UserEvent { id: string; name: string; }
      @channel("users")
      op publish(): UserEvent;
    `);

    expect(doc.components!.messages!["user.created.v2"]).toBeDefined();
    expect(doc.components!.messages!.UserEvent).toBeUndefined();
  });

  it("keeps schema $ref pointing to the model name", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @messageId("user.created.v2")
      model UserEvent { id: string; name: string; }
      @channel("users")
      op publish(): UserEvent;
    `);

    const msg = doc.components!.messages!["user.created.v2"] as MessageObject;
    expect(msg.payload).toStrictEqual({
      $ref: "#/components/schemas/UserEvent",
    });
    expect(doc.components!.schemas!.UserEvent).toBeDefined();
  });

  it("propagates through the channel messages $ref chain", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @messageId("order.event")
      model OrderPlaced { orderId: string; }
      @channel("orders")
      op publish(): OrderPlaced;
    `);

    const channel = doc.channels!["orders"];
    expect(channel.messages!["order.event"]).toBeDefined();
    expect(channel.messages!["order.event"].$ref).toBe(
      "#/components/messages/order.event",
    );
    expect(channel.messages!.OrderPlaced).toBeUndefined();
  });

  it("propagates through the operation messages $ref chain", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @messageId("order.event")
      model OrderPlaced { orderId: string; }
      @channel("orders")
      op publish(): OrderPlaced;
    `);

    const [op] = Object.values(doc.operations!);
    expect(op.messages).toBeDefined();
    expect(op.messages![0].$ref).toBe("#/channels/orders/messages/order.event");
  });
});

describe("integration: @operationId + @messageId together", () => {
  it("both decorators work in the same document", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @messageId("user.created.event")
      model UserCreated { userId: string; }
      @messageId("user.deleted.event")
      model UserDeleted { userId: string; }
      @channel("users.created")
      @operationId("pub.user.created")
      op publishCreated(): UserCreated;
      @channel("users.deleted")
      @operationId("pub.user.deleted")
      op publishDeleted(): UserDeleted;
    `);

    expect(doc.operations!["pub.user.created"]).toBeDefined();
    expect(doc.operations!["pub.user.deleted"]).toBeDefined();

    expect(doc.components!.messages!["user.created.event"]).toBeDefined();
    expect(doc.components!.messages!["user.deleted.event"]).toBeDefined();

    const createdOp = doc.operations!["pub.user.created"];
    expect(createdOp.messages![0].$ref).toBe(
      "#/channels/users.created/messages/user.created.event",
    );

    const createdChannel = doc.channels!["users.created"];
    expect(createdChannel.messages!["user.created.event"].$ref).toBe(
      "#/components/messages/user.created.event",
    );

    const createdMsg = doc.components!.messages![
      "user.created.event"
    ] as MessageObject;
    expect(createdMsg.payload).toStrictEqual({
      $ref: "#/components/schemas/UserCreated",
    });
  });
});
