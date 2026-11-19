import { readFile } from "node:fs/promises";

import { importAsyncAPI } from "../../src/importer/convert.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { inlineObject } from "../utils/type-guards.js";

const eventMessage = (key: string) => ({
  $ref: `#/channels/events/messages/${key}`,
});

async function expectSnapshot(source: string, name: string) {
  const expected = await readFile(
    new URL(`fixtures/${name}.tsp`, import.meta.url),
    "utf8",
  );
  expect(source).toBe(expected.replaceAll("\r\n", "\n"));
}

describe("asyncAPI import round trip", () => {
  it("snapshots an adapted public-spec example and re-emits its contract", async () => {
    const input = await readFile(
      new URL("fixtures/account-events.yaml", import.meta.url),
      "utf8",
    );
    const result = await importAsyncAPI(input);
    await expectSnapshot(result.source, "account-events");
    expect(result.warnings).toStrictEqual([
      expect.objectContaining({
        code: "normalized-value",
        pointer: "/channels/registrations",
      }),
    ]);

    const emitted = await compileAndValidateOrThrow(result.source);
    const address = "accounts/registered";
    expect(emitted.info).toMatchObject({
      title: "Account Notifications",
      version: "1.0.0",
    });
    expect(emitted.servers?.events).toMatchObject({
      host: "broker.example.test",
      protocol: "kafka",
    });
    expect(emitted.channels?.[address]).toMatchObject({
      address,
      servers: [{ $ref: "#/servers/events" }],
      messages: { Registered: { $ref: "#/components/messages/Registered" } },
    });
    expect(emitted.operations).toMatchObject({
      sendRegistration: {
        action: "send",
        channel: { $ref: "#/channels/accounts~1registered" },
        messages: [
          { $ref: "#/channels/accounts~1registered/messages/Registered" },
        ],
      },
      receiveRegistration: { action: "receive" },
    });
    expect(emitted.components?.messages?.Registered).toMatchObject({
      contentType: "application/vnd.account+json",
      payload: { $ref: "#/components/schemas/AccountRegistration" },
    });
    expect(emitted.components?.schemas?.AccountRegistration).toMatchObject({
      additionalProperties: false,
      required: ["userId"],
      properties: {
        userId: { type: "string", minLength: 3 },
        verified: { type: "boolean", default: false },
        previous: { $ref: "#/components/schemas/AccountRegistration" },
      },
    });
  });

  it("preserves escaped keys, nullable values, and falsy defaults from JSON", async () => {
    const title = `Example "quoted" \${name} \\`;
    const description = `Literal */ \${value}`;
    const input = {
      asyncapi: "3.1.0",
      info: { title, version: "2" },
      channels: {
        "events/~new": {
          address: "events/~new",
          messages: {
            new: { payload: { $ref: "#/components/schemas/event~1~0payload" } },
          },
        },
      },
      operations: {
        "send-event": {
          action: "send",
          channel: { $ref: "#/channels/events~1~0new" },
        },
      },
      components: {
        schemas: {
          "event/~payload": {
            type: "object",
            required: ["hello-world"],
            properties: {
              "hello-world": {
                type: ["string", "null"],
                default: "",
                description,
              },
              count: { type: "integer", default: 0 },
              labels: { type: "array", items: { type: "string" }, minItems: 1 },
              counts: {
                type: "object",
                additionalProperties: { type: "integer" },
              },
            },
          },
        },
      },
    };
    const result = await importAsyncAPI(
      JSON.stringify(input),
      "Custom Namespace",
    );
    expect(result.source).toContain("namespace Custom_Namespace;");
    await expectSnapshot(result.source, "escaped-keys");
    const emitted = await compileAndValidateOrThrow(result.source);
    expect(emitted.info.title).toBe(title);
    expect(emitted.operations?.["send-event"]).toMatchObject({
      action: "send",
    });
    const schema = inlineObject(emitted.components?.schemas?.event__payload);
    expect(schema.required).toStrictEqual(["hello-world"]);
    expect(schema.properties).toMatchObject({
      "hello-world": {
        anyOf: [{ type: "string" }, { type: "null" }],
        default: "",
        description,
      },
      count: { type: "integer", default: 0 },
      labels: { type: "array", items: { type: "string" }, minItems: 1 },
      counts: { type: "object", additionalProperties: { type: "integer" } },
    });
  });

  it("preserves operation message subsets and order on a shared channel", async () => {
    const channel = { $ref: "#/channels/events" };
    const result = await importAsyncAPI(
      JSON.stringify({
        asyncapi: "3.1.0",
        info: { title: "Events", version: "1" },
        channels: {
          events: {
            address: "events",
            messages: {
              Created: {
                payload: {
                  type: "object",
                  properties: { id: { type: "string" } },
                },
              },
              Deleted: {
                payload: {
                  type: "object",
                  properties: { reason: { type: "string" } },
                },
              },
            },
          },
        },
        operations: {
          sendEvents: {
            action: "send",
            channel,
            messages: [eventMessage("Deleted"), eventMessage("Created")],
          },
          receiveCreated: {
            action: "receive",
            channel,
            messages: [eventMessage("Created")],
          },
        },
      }),
    );
    expect(result.warnings).toStrictEqual([]);
    const emitted = await compileAndValidateOrThrow(result.source);
    expect(emitted.operations?.sendEvents?.messages).toStrictEqual([
      eventMessage("Deleted"),
      eventMessage("Created"),
    ]);
    expect(emitted.operations?.receiveCreated?.messages).toStrictEqual([
      eventMessage("Created"),
    ]);
  });

  it("URI-encodes percent signs in refs without changing the channel key", async () => {
    const address = "events%2Fnew";
    const channelRef = "#/channels/events%252Fnew";
    const messageRef = `${channelRef}/messages/Created`;
    const result = await importAsyncAPI(
      JSON.stringify({
        asyncapi: "3.1.0",
        info: { title: "Events", version: "1" },
        channels: {
          [address]: {
            address,
            messages: { Created: { payload: { type: "object" } } },
          },
        },
        operations: {
          sendEvent: {
            action: "send",
            channel: { $ref: channelRef },
            messages: [{ $ref: messageRef }],
          },
        },
      }),
    );
    const emitted = await compileAndValidateOrThrow(result.source);
    expect(emitted.channels?.[address]).toMatchObject({ address });
    expect(emitted.operations?.sendEvent).toMatchObject({
      channel: { $ref: channelRef },
      messages: [{ $ref: messageRef }],
    });
  });

  it("re-emits a referenced server with host template variables", async () => {
    const result = await importAsyncAPI(
      JSON.stringify({
        asyncapi: "3.1.0",
        info: { title: "Events", version: "1" },
        servers: { regional: { $ref: "#/components/servers/broker" } },
        components: {
          servers: {
            broker: {
              host: "{region}.example.test",
              protocol: "mqtt",
              protocolVersion: "5.0",
              pathname: "/events",
              description: "Regional broker",
              variables: {
                region: {
                  $ref: "#/components/serverVariables/region",
                },
              },
            },
          },
          serverVariables: {
            region: {
              enum: ["us", "eu"],
              default: "us",
              description: "Broker region",
            },
          },
        },
      }),
    );
    expect(result.warnings.map(({ pointer }) => pointer)).toContain(
      "/components/servers/broker/variables/region",
    );
    const emitted = await compileAndValidateOrThrow(result.source);
    expect(emitted.servers?.regional).toMatchObject({
      host: "{region}.example.test",
      protocol: "mqtt",
      protocolVersion: "5.0",
      pathname: "/events",
      description: "Regional broker",
      variables: {
        region: {
          enum: ["us", "eu"],
          default: "us",
          description: "Broker region",
        },
      },
    });
  });
});
