import { importAsyncAPI } from "../../src/importer/convert.js";
import { ImportDocument } from "../../src/importer/input.js";
import { extractSchemaDeclarations } from "../../src/importer/schema-source.js";

const root = {
  asyncapi: "3.1.0",
  info: { title: "Test Events", version: "1" },
};

function document(payload: unknown, messages?: unknown) {
  return {
    ...root,
    channels: {
      "test/~event": {
        address: "test/~event",
        messages: { message: { payload } },
      },
    },
    operations: {
      "send-event": {
        action: "send",
        channel: { $ref: "#/channels/test~1~0event" },
        messages,
      },
    },
  };
}

describe("import graph and schema adapter", () => {
  it("resolves URI escapes and pointers without looking up inherited keys", () => {
    const doc = new ImportDocument(
      JSON.stringify({ ...root, "a/b~c ": ["value"] }),
    );
    expect(doc.lookup("#/a~1b~0c%20/0", "/source")).toStrictEqual({
      value: "value",
      pointer: "/a~1b~0c /0",
    });
    expect(() => doc.lookup("#/toString", "/source")).toThrow(
      "Unresolved reference",
    );
    expect(() => doc.lookup("#/a~3", "/source")).toThrow(
      "Invalid JSON Pointer escape",
    );
    expect(() => doc.lookup("#/%FG", "/source")).toThrow("Malformed percent");
  });

  it.each([
    [
      "external",
      { $ref: "https://example.test/other.yaml" },
      "External references",
    ],
    [
      "missing",
      { $ref: "#/components/schemas/Unknown" },
      "Unresolved reference",
    ],
    [
      "circular object",
      { $ref: "#/channels/test~1~0event/messages/message/payload" },
      "Circular object reference",
    ],
    [
      "multi-format",
      { schemaFormat: "application/vnd.apache.avro", schema: {} },
      "JSON object payload",
    ],
    ["non-model", { type: "string" }, "JSON object payload"],
  ])("rejects a %s payload", async (_name, payload, error) => {
    const input = JSON.stringify(document(payload));
    await expect(importAsyncAPI(input)).rejects.toThrow(error);
  });

  it("distinguishes no messages from implicit channel membership", async () => {
    const empty = JSON.stringify(document({ type: "object" }, []));
    await expect(importAsyncAPI(empty)).rejects.toMatchObject({
      pointer: "/operations/send-event/messages",
      message: "Operations without messages are not supported.",
    });
    const foreign = JSON.stringify(
      document({ type: "object" }, [
        { $ref: "#/channels/test~1~0event/messages/message/payload" },
      ]),
    );
    await expect(importAsyncAPI(foreign)).rejects.toThrow(
      "must reference a message entry on its channel",
    );
  });

  it("warns with precise pointers when optional fields cannot be lowered", async () => {
    const input = {
      ...document({ type: "object", not: { properties: { forbidden: {} } } }),
      id: "urn:test:events",
    };
    const result = await importAsyncAPI(JSON.stringify(input));
    expect(result.warnings.map((warning) => warning.pointer)).toStrictEqual([
      "/id",
      "/channels/test~1~0event/messages/message/payload/not",
    ]);
    expect(result.source).toContain('@operationId("send-event")');
  });

  it("omits empty optional operation docs but preserves nonempty docs", async () => {
    const input = document({ type: "object" });
    const operation = input.operations["send-event"];
    const withDescription = (description: unknown) =>
      JSON.stringify({
        ...input,
        operations: {
          sendEvent: { ...operation, description, summary: "" },
        },
      });

    const empty = await importAsyncAPI(withDescription(""));
    expect(empty.source).not.toMatch(/@(?:doc|summary)\(/u);
    const nonempty = await importAsyncAPI(withDescription("Sends an event"));
    expect(nonempty.source).toContain('@doc("Sends an event")');
    await expect(importAsyncAPI(withDescription(42))).rejects.toMatchObject({
      pointer: "/operations/sendEvent/description",
    });
  });

  it("reports unused reusable messages without generating an operation for them", async () => {
    const input = {
      ...root,
      components: { messages: { Unused: { payload: { type: "object" } } } },
    };
    const result = await importAsyncAPI(JSON.stringify(input));
    expect(result.source).not.toContain("Unused");
    expect(result.warnings).toStrictEqual([
      expect.objectContaining({ pointer: "/components/messages/Unused" }),
    ]);
  });

  it.each(["$message.payload", "$message.header#/id"])(
    "preserves the correlation location %s",
    async (location) => {
      const result = await importAsyncAPI(`
asyncapi: 3.1.0
info: { title: Events, version: '1' }
channels:
  events:
    address: events
    messages:
      Event:
        payload: { type: object }
        correlationId: { location: '${location}' }
operations:
  sendEvent:
    action: send
    channel: { $ref: '#/channels/events' }`);
      expect(result.source).toContain(`@correlationId("${location}")`);
    },
  );

  it("rejects a converter response that omits an expected declaration", () => {
    const expected = new Map([["Payload", { annotations: new Map() }]]);
    expect(() =>
      extractSchemaDeclarations("namespace SchemaAdapter;", expected),
    ).toThrow("Schema converter omitted declarations.");
  });
});
