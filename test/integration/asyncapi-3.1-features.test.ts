/**
 * Integration tests for AsyncAPI 3.1 features added in v0.2.x:
 *
 * - AsyncAPI 3.1 server.protocolVersion + server.pathname + server.variables
 * - AsyncAPI 3.1 channel.servers via @useChannelServer
 * - AsyncAPI 3.1 message.schemaFormat (Avro/Protobuf)
 * - AsyncAPI 3.1 message.examples via @message config
 * - @operationSecurity: Security Requirement on operations
 * - @defaultContentType: MIME type validation
 * - Named unions registered in components.schemas
 * - Model property reference unwrapping (User.id)
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";
import {
  compileAndValidateOrThrow,
} from "../utils/schema-validator.js";

describe("asyncAPI 3.1: server.protocolVersion + server.pathname + variables", () => {
  it("emits server.protocolVersion from @server config", async () => {
    const source = `
      namespace KafkaApi;

      @server("production", #{
        url: "kafka.example.com:9092",
        protocol: "kafka",
        protocolVersion: "3.0.0",
        description: "Kafka 3.0 broker"
      })
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.servers?.production?.protocolVersion).toBe("3.0.0");
  });

  it("emits server.pathname from @server config", async () => {
    const source = `
      namespace WsApi;

      @server("ws", #{
        url: "api.example.com",
        protocol: "ws",
        pathname: "/v1/ws"
      })
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.servers?.ws?.pathname).toBe("/v1/ws");
  });

  it("emits server.variables enum + default + description from @server config", async () => {
    const source = `
      namespace Brokered;

      @server("kafka", #{
        url: "{broker}.example.com:9092",
        protocol: "kafka",
        variables: #{
          broker: #{
            enum: ["broker1", "broker2", "broker3"],
            default: "broker1",
            description: "Kafka broker hostname"
          }
        }
      })
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    const broker = result.asyncApiDoc?.servers?.kafka?.variables?.broker;
    expect(broker?.enum).toStrictEqual(["broker1", "broker2", "broker3"]);
    expect(broker?.default).toBe("broker1");
    expect(broker?.description).toContain("Kafka broker");
  });

  it("emits server.security from @server config", async () => {
    const source = `
      namespace SecureBroker;

      @server("kafka", #{
        url: "secure.example.com:9092",
        protocol: "kafka-secure",
        security: #{ sasl: #["scramSha512"] }
      })
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.servers?.kafka?.security).toStrictEqual([
      { sasl: ["scramSha512"] },
    ]);
  });
});

describe("asyncAPI 3.1: channel.servers via @useChannelServer", () => {
  it("attaches server $refs to channel.servers", async () => {
    const source = `
      namespace MultiServer;

      @server("primary", #{ url: "primary.example.com", protocol: "kafka" })
      @server("backup", #{ url: "backup.example.com", protocol: "kafka" })
      @channel("events")
      @useChannelServer("primary")
      @useChannelServer("backup")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    const channel = result.asyncApiDoc?.channels?.events;
    expect(channel?.servers).toStrictEqual([
      { $ref: "#/servers/primary" },
      { $ref: "#/servers/backup" },
    ]);
  });
});

describe("asyncAPI 3.1: message.schemaFormat (Avro/Protobuf)", () => {
  it("emits schemaFormat on message when set via @message", async () => {
    const source = `
      namespace AvroEvents;

      @message(#{
        title: "UserCreated",
        schemaFormat: "application/vnd.apache.avro+json;version=1.9.0"
      })
      model UserCreated {
        id: int64;
        name: string;
      }

      @channel("users.created")
      op publish(): UserCreated;
    `;
    const result = await compileAsyncAPI(source);
    expect(
      result.asyncApiDoc?.components?.messages?.UserCreated?.schemaFormat,
    ).toBe("application/vnd.apache.avro+json;version=1.9.0");
  });

  it("emits Protobuf schemaFormat", async () => {
    const source = `
      namespace PbEvents;

      @message(#{ schemaFormat: "application/vnd.google.protobuf" })
      model OrderEvent { id: string; }

      @channel("orders")
      op publish(): OrderEvent;
    `;
    const result = await compileAsyncAPI(source);
    expect(
      result.asyncApiDoc?.components?.messages?.OrderEvent?.schemaFormat,
    ).toBe("application/vnd.google.protobuf");
  });
});

describe("asyncAPI 3.1: message.examples", () => {
  it("emits message.examples from @message config", async () => {
    const source = `
      namespace ExampleEvents;

      @message(#{
        title: "OrderPlaced",
        examples: #[
          #{
            name: "minimal",
            summary: "Minimal order",
            payload: #{ orderId: "abc", total: 100 }
          },
          #{
            name: "full",
            summary: "Full order with currency",
            payload: #{ orderId: "xyz", total: 250, currency: "USD" }
          }
        ]
      })
      model OrderPlaced {
        orderId: string;
        total: int32;
        currency?: string;
      }

      @channel("orders.placed")
      op publish(): OrderPlaced;
    `;
    const result = await compileAsyncAPI(source);
    const msg = result.asyncApiDoc?.components?.messages?.OrderPlaced;
    expect(msg?.examples).toHaveLength(2);
    expect(msg?.examples?.[0]?.name).toBe("minimal");
    expect(msg?.examples?.[0]?.payload).toStrictEqual({ orderId: "abc", total: 100 });
    expect(msg?.examples?.[1]?.payload).toStrictEqual({
      orderId: "xyz",
      total: 250,
      currency: "USD",
    });
  });
});

describe("@operationSecurity: operation-level Security Requirements", () => {
  it("attaches SecurityRequirement to operation.security array", async () => {
    const source = `
      namespace SecuredOps;

      @security(#{
        name: "jwt",
        scheme: #{ type: "http", scheme: "bearer", bearerFormat: "JWT" }
      })
      @security(#{
        name: "apiKey",
        scheme: #{ type: "apiKey", in: "header", name: "X-API-Key" }
      })
      namespace SecuredOps;

      @channel("events")
      @operationSecurity(#{ name: "jwt" })
      @operationSecurity(#{ name: "apiKey", scopes: #["read", "write"] })
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    const op = result.asyncApiDoc?.operations?.publishEvent;
    expect(op?.security).toStrictEqual([
      { jwt: [] },
      { apiKey: ["read", "write"] },
    ]);
  });
});

describe("@defaultContentType: MIME type validation", () => {
  it("accepts a valid MIME type", async () => {
    const source = `
      namespace MimeOk;

      @defaultContentType("application/json")
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.defaultContentType).toBe("application/json");
  });

  it("accepts a vendor MIME type", async () => {
    const source = `
      namespace VendorMime;

      @defaultContentType("application/vnd.apache.avro+json")
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.defaultContentType).toBe(
      "application/vnd.apache.avro+json",
    );
  });

  it("warns on an invalid MIME type", async () => {
    const source = `
      namespace BadMime;

      @defaultContentType("not a mime")
      @channel("events")
      op publishEvent(): string;
    `;
    const result = await compileAsyncAPI(source);
    const warnings = result.diagnostics.filter(
      (d) =>
        d.code === "@lars-artmann/typespec-asyncapi/invalid-default-content-type",
    );
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe("named unions registered in components.schemas", () => {
  it("emits named union as a top-level schema", async () => {
    const source = `
      namespace UnionsApi;

      union Color {
        red: "red",
        green: "green",
        blue: "blue",
      }

      @channel("events")
      op publish(): Color;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.components?.schemas?.Color).toBeDefined();
    expect(result.asyncApiDoc?.components?.schemas?.Color).toMatchObject({
      oneOf: [{ const: "red" }, { const: "green" }, { const: "blue" }],
    });
  });

  it("emits mixed-type named union as anyOf", async () => {
    const source = `
      namespace MixedUnion;

      union AnyValue {
        stringValue: string,
        intValue: int32,
      }

      @channel("events")
      op publish(): AnyValue;
    `;
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.components?.schemas?.AnyValue).toBeDefined();
    expect(result.asyncApiDoc?.components?.schemas?.AnyValue?.anyOf).toBeDefined();
  });
});

describe("model property reference unwrapping", () => {
  it("resolves User.id property reference to the underlying scalar type", async () => {
    const source = `
      namespace RefApi;

      model User {
        id: safeint;
        username: string;
      }

      model Profile {
        user: User;
        createdBy: User.id;
      }

      @channel("profiles")
      op publish(): Profile;
    `;
    const result = await compileAsyncAPI(source);
    const profile = result.asyncApiDoc?.components?.schemas?.Profile;
    expect(profile?.properties?.createdBy).toMatchObject({
      format: "safeint",
      type: "integer",
    });
  });
});

describe("combined: full AsyncAPI 3.1 surface", () => {
  it("emits a complete server/channel/message/operation graph that passes AsyncAPI 3.1 schema validation", async () => {
    const source = `
      namespace Complete;

      model OrderPlaced {
        orderId: string;
        total: float64;
        @visibility(Lifecycle.Read)
        createdAt: utcDateTime;
      }

      union Status {
        pending: "pending",
        confirmed: "confirmed",
        shipped: "shipped",
      }

      @server("production", #{
        url: "{broker}.kafka.example.com:9092",
        protocol: "kafka",
        protocolVersion: "3.0.0",
        variables: #{
          broker: #{
            enum: ["broker1", "broker2"],
            default: "broker1"
          }
        },
        description: "Kafka cluster"
      })
      @defaultContentType("application/json")
      @useChannelServer("production")
      @channel("orders.placed")
      @publish
      @operationSecurity(#{ name: "jwt" })
      op publishOrderPlaced(): OrderPlaced;
    `;
    const doc = await compileAndValidateOrThrow(source);
    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.servers?.production?.protocolVersion).toBe("3.0.0");
    expect(doc.operations?.publishOrderPlaced?.security).toStrictEqual([
      { jwt: [] },
    ]);
  });
});