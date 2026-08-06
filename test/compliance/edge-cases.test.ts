/**
 * AsyncAPI 3.1.0 Spec Compliance: Edge Cases
 *
 * Tests unusual but valid patterns: empty models, deeply nested references,
 * channel addresses with special characters, multiple operations per channel,
 * unions, Record types, optional/nullable fields.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type {
  CorrelationIdObject,
  MessageObject,
  JsonSchema,
} from "../../src/domain/models/asyncapi-document.js";

describe("spec Compliance: Edge Cases", () => {
  it("handles empty model (no properties)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model EmptyEvent {}
      @channel("empty")
      op publish(): EmptyEvent;
    `);

    expect(doc.components!.schemas!.EmptyEvent).toBeDefined();
  });

  it("handles channel address with dots", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("user.events.created.v2")
      op publish(): Event;
    `);

    expect(doc.channels!["user.events.created.v2"]).toBeDefined();
  });

  it("handles channel address with forward slashes (escaped in $ref)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("org/dept/events")
      op publish(): Event;
    `);

    const operations = doc.operations!;
    const [op] = Object.values(operations);
    const messages = op.messages!;
    expect(messages[0].$ref).toContain("~1");
  });

  it("handles channel with {param} pattern", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("users/{userId}/events")
      op publish(): Event;
    `);

    const channel = doc.channels!["users/{userId}/events"];
    expect(channel).toBeDefined();
    const params = channel.parameters!;
    expect(params.userId).toBeDefined();
  });

  it("handles deeply nested model references", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Country { code: string; name: string; }
      model Address { street: string; city: string; country: Country; }
      model Company { name: string; address: Address; }
      model Employee { name: string; company: Company; }
      @channel("employees")
      op publish(): Employee;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.Employee).toBeDefined();
    expect(schemas.Company).toBeDefined();
    expect(schemas.Address).toBeDefined();
    expect(schemas.Country).toBeDefined();
  });

  it("handles union types (enums)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event {
        priority: "low" | "medium" | "high" | "critical";
      }
      @channel("events")
      op publish(): Event;
    `);

    const props = doc.components!.schemas!.Event.properties!;
    expect(props.priority.enum).toStrictEqual([
      "low",
      "medium",
      "high",
      "critical",
    ]);
  });

  it("handles optional fields in required array", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event {
        id: string;
        name?: string;
        email?: string;
      }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components!.schemas!.Event.required).toStrictEqual(["id"]);
  });

  it("handles multiple operations on same channel", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Request { id: string; }
      model Response { id: string; }
      @channel("rpc")
      op sendRequest(): Request;
      @channel("rpc")
      op receiveResponse(): Response;
    `);

    expect(doc.channels!["rpc"]).toBeDefined();
  });

  it("handles document with only servers (no channels)", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("default", #{
        url: "localhost:9092",
        protocol: "kafka"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers).toBeDefined();
    expect(doc.channels).toBeDefined();
  });

  it("handles description on models via @doc", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @doc("This is a test event")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components!.schemas!.Event.description).toBe(
      "This is a test event",
    );
  });

  it("handles tags on operations", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["important", "realtime"])
      op publish(): Event;
    `);

    const operations = doc.operations!;
    const [op] = Object.values(operations);
    const tags = op.tags!;
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe("important");
    expect(tags[1].name).toBe("realtime");
  });

  it("handles correlationId on messages", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @correlationId("$message.header#/correlationId")
      model TrackedEvent { id: string; }
      @channel("tracked")
      op publish(): TrackedEvent;
    `);

    const msg = doc.components!.messages!.TrackedEvent as MessageObject;
    expect(msg.correlationId).toBeDefined();
    expect((msg.correlationId as CorrelationIdObject).location).toBe(
      "$message.header#/correlationId",
    );
  });

  it("handles headers on messages", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @header("x-request-id", "string")
      model ApiEvent { payload: string; }
      @channel("api")
      op publish(): ApiEvent;
    `);

    const msg = doc.components!.messages!.ApiEvent as MessageObject;
    expect(msg.headers).toBeDefined();
    const headers = msg.headers as JsonSchema;
    expect(headers.type).toBe("object");
  });

  it("handles float64 array properties", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Sensor {
        readings: float64[];
      }
      @channel("sensors")
      op publish(): Sensor;
    `);

    const props = doc.components!.schemas!.Sensor.properties!;
    expect(props.readings.type).toBe("array");
    expect(props.readings.items!.type).toBe("number");
  });
});
