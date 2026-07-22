/**
 * AsyncAPI 3.1.0 Spec Compliance: @doc propagation
 *
 * Validates that @doc on channel-decorated operations produces
 * channel descriptions that validate against the AsyncAPI 3.1.0 JSON Schema.
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

    const channel = doc.channels?.["users.events"] as Record<string, unknown> | undefined;
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

    const op = doc.operations?.publishEvent as Record<string, unknown> | undefined;
    expect(op).toBeDefined();
    expect(op?.description).toBe("Publishes events");
  });

  it("propagates @doc to message summary with @message decorator", async () => {
    const doc = await compileAndValidateOrThrow(`
      @doc("A user event message")
      @message(#{ title: "UserEvent" })
      model UserEvent { id: string; }
      @channel("events")
      @publish
      op publishUserEvent(): UserEvent;
    `);

    const msg = doc.components?.messages?.UserEvent as Record<string, unknown> | undefined;
    expect(msg).toBeDefined();
    expect(msg?.summary).toBe("A user event message");
  });
});
