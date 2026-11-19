/**
 * Decorator Output Tests
 *
 * Verifies that @tags, @correlationId, @header, and @bindings decorators
 * actually produce correct output in the generated AsyncAPI document.
 */

import {
  compileAsyncAPI,
  compileAsyncAPISpecWithoutErrors,
  compileAsyncAPIWithoutErrors,
} from "../utils/test-helpers";
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

describe("decorator Output: channel identity", () => {
  it("keeps channels at the same address separate while pairing send and receive", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPIWithoutErrors(`
      @server("main", #{ url: "wss://example.test", protocol: "wss" })
      namespace Demo;
      model Event { id: string; }
      @doc("Conversation connection")
      @summary("Conversation")
      @tags(#["conversation"])
      @useChannelServer("main")
      @protocol(#{ protocol: "ws", queryParams: #{
        type: "object", properties: #{ mode: #{ \`enum\`: #["conversation"] } }
      } })
      @channel("/v1/realtime", "conversation")
      @publish op sendConversation(): Event;
      @channel("/v1/realtime", "conversation")
      @subscribe op receiveConversation(): Event;
      @doc("Transcription connection")
      @protocol(#{ protocol: "ws", queryParams: #{
        type: "object", properties: #{ mode: #{ \`enum\`: #["transcription"] } }
      } })
      @channel("/v1/realtime", "transcription")
      @publish op sendTranscription(): Event;
    `);
    expect(Object.keys(doc.channels)).toStrictEqual([
      "conversation",
      "transcription",
    ]);
    expect(doc.channels.conversation.address).toBe("/v1/realtime");
    expect(doc.channels.transcription.address).toBe("/v1/realtime");
    expect(doc.channels.conversation.bindings).toMatchObject({
      ws: { query: { properties: { mode: { enum: ["conversation"] } } } },
    });
    expect(doc.channels.transcription.bindings).toMatchObject({
      ws: { query: { properties: { mode: { enum: ["transcription"] } } } },
    });
    expect(doc.channels.conversation.description).toBe(
      "Conversation connection",
    );
    expect(doc.channels.transcription.description).toBe(
      "Transcription connection",
    );
    expect(doc.channels.conversation.summary).toBe("Conversation");
    expect(doc.channels.conversation.tags).toStrictEqual([
      { name: "conversation" },
    ]);
    expect(doc.channels.conversation.servers).toStrictEqual([
      { $ref: "#/servers/main" },
    ]);
    expect(doc.operations.sendConversation.channel).toStrictEqual({
      $ref: "#/channels/conversation",
    });
    expect(doc.operations.receiveConversation.channel).toStrictEqual(
      doc.operations.sendConversation.channel,
    );
    expect(doc.operations.receiveConversation.messages).toStrictEqual([
      { $ref: "#/channels/conversation/messages/Event" },
    ]);
    expect(doc.operations.sendTranscription.messages).toStrictEqual([
      { $ref: "#/channels/transcription/messages/Event" },
    ]);
  });

  it("uses the address for channel parameters and keeps one-argument behavior", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPIWithoutErrors(`
      @parameter("session_id", #{ description: "Session ID" })
      @reusableBinding("socket", #{ ws: #{ method: "GET" } })
      namespace Demo;
      model Event { id: string; }
      @useChannelBinding("socket")
      @channel("sessions/{session_id}/events", "sessionEvents")
      op receive(): Event;
      @channel("legacy") @publish op sendLegacy(): Event;
    `);
    expect(doc.channels.sessionEvents.address).toBe(
      "sessions/{session_id}/events",
    );
    expect(doc.channels.sessionEvents.parameters).toStrictEqual({
      session_id: { $ref: "#/components/parameters/session_id" },
    });
    expect(doc.channels.sessionEvents.bindings).toStrictEqual({
      $ref: "#/components/channelBindings/socket",
    });
    expect(doc.operations.receive.channel).toStrictEqual({
      $ref: "#/channels/sessionEvents",
    });
    expect(doc.channels.legacy.address).toBe("legacy");
    expect(doc.operations.sendLegacy.channel).toStrictEqual({
      $ref: "#/channels/legacy",
    });
  });

  it.each([
    [
      "empty IDs",
      '@channel("events", "") op receive(): Event;',
      "invalid-channel-id",
    ],
    [
      "conflicting addresses",
      '@channel("first", "shared") op first(): Event; @channel("second", "shared") op second(): Event;',
      "conflicting-channel-address",
    ],
  ])("rejects %s", async (_, source, code) => {
    const result = await compileAsyncAPI(`
      model Event { id: string; }
      ${source}
    `);
    expect(
      result.diagnostics
        .filter((d) => d.severity === "error")
        .map((d) => d.code),
    ).toContain(`@lars-artmann/typespec-asyncapi/${code}`);
  });
});

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

describe("decorator Output: @doc on channels", () => {
  it("should propagate @doc to channel description", async () => {
    const doc = await compileAndGetDoc(`
      @doc("User lifecycle events for the platform")
      @channel("users.events")
      @publish
      op publishUserEvent(): UserEvent;

      model UserEvent { id: string; }
    `);

    const channel = doc.channels?.["users.events"];
    expect(channel).toBeDefined();
    expect(channel.description).toBe("User lifecycle events for the platform");
  });

  it("should not override channel description if already set", async () => {
    const doc = await compileAndGetDoc(`
      @doc("Should not appear")
      @channel("custom.events")
      @publish
      op publishCustomEvent(): CustomEvent;

      model CustomEvent { id: string; }
    `);

    const channel = doc.channels?.["custom.events"];
    expect(channel).toBeDefined();
    expect(channel.description).toBe("Should not appear");
  });

  it("should propagate @doc to operation description", async () => {
    const doc = await compileAndGetDoc(`
      @doc("Publishes user events to the platform")
      @channel("users.events")
      @publish
      op publishUserEvent(): UserEvent;

      model UserEvent { id: string; }
    `);

    const op = doc.operations?.publishUserEvent;
    expect(op).toBeDefined();
    expect(op.description).toBe("Publishes user events to the platform");
  });

  it("should propagate @doc to message summary when no @message description", async () => {
    const doc = await compileAndGetDoc(`
      @doc("Represents a user lifecycle event")
      model UserEvent { id: string; }

      @channel("users.events")
      @publish
      op publishUserEvent(): UserEvent;
    `);

    const msg = doc.channels?.["users.events"]?.messages?.UserEvent;
    expect(msg).toBeDefined();
  });
});
