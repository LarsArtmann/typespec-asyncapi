/**
 * External Spec Compilation Tests (T5)
 *
 * Compiles representative model/type patterns from external projects through
 * the AsyncAPI emitter to surface unknown failure modes.
 *
 * Patterns sourced from:
 * - Kernovia (branded types, scalar inheritance, complex models)
 * - typespec-eventsourcing (generics, spread, CQRS patterns)
 * - blog/content-spec (event hierarchies, nested anonymous models)
 * - accountability-system (enum-heavy, Record types)
 * - ActaFlow (union types, complex property graphs)
 *
 * NOTE: @service is a core TypeSpec decorator (not AsyncAPI-specific). It
 * requires value-literal syntax: @service(#{title: "My API"}), NOT model
 * expression syntax @service({title: "My API"}). The emitter reads the
 * @service title and uses it for the document info.title (emitter options
 * take precedence). See test/decorators/service.test.ts for coverage.
 */

import {
  compileAsyncAPI,
  compileAsyncAPISpecRaw,
} from "../utils/test-helpers.js";
import { validateAsyncAPIDocument } from "../utils/schema-validator.js";

describe("external Spec Compilation — Branded Types & Scalar Inheritance", () => {
  it("should handle scalar extends string (Kernovia NanoID pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        scalar NanoID extends string;
        scalar ActorId extends NanoID;
        scalar SemanticVersion extends string;

        model Event {
          id: NanoID;
          actorId: ActorId;
          version: SemanticVersion;
        }

        @channel("events")
        @publish
        op publishEvent(): Event;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "branded-types",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.Event).not.toBeNull();
    expect(schemas.Event.type).toBe("object");
    // User-declared scalars are declared and referenced like models
    expect(schemas.Event.properties.id).toStrictEqual({
      $ref: "#/components/schemas/NanoID",
    });
    expect(schemas.Event.properties.actorId).toStrictEqual({
      $ref: "#/components/schemas/ActorId",
    });
    expect(schemas.Event.required).toStrictEqual(["id", "actorId", "version"]);
  });

  it("should handle model spread (eventsourcing BrandedId pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model BrandedId {
          value: string;
          __brand: string;
        }

        model EventId {
          ...BrandedId;
          timestamp: string;
        }

        @channel("events")
        @publish
        op publishEvent(): EventId;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "spread-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // Spread members are flattened into the derived model
    const { EventId: eventId } = schemas;
    expect(eventId.properties.value).toStrictEqual({ type: "string" });
    expect(eventId.properties["__brand"]).toStrictEqual({ type: "string" });
    expect(eventId.properties.timestamp).toStrictEqual({ type: "string" });
    expect(eventId.required).toStrictEqual(["value", "__brand", "timestamp"]);
  });

  it("should handle generic models (eventsourcing BrandedId<Brand> pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model BrandedId<Brand extends string> {
          value: string;
          __brand: Brand;
        }

        model TypedEvent {
          id: BrandedId<"event">;
          name: string;
        }

        @channel("events")
        @publish
        op publishEvent(): TypedEvent;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "generic-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // BrandedId<"event"> inlines with the brand as a const
    const idProp = schemas.TypedEvent.properties.id;
    expect(idProp.properties["__brand"]).toStrictEqual({ const: "event" });
    expect(idProp.required).toStrictEqual(["value", "__brand"]);
    expect(schemas.TypedEvent.properties.name).toStrictEqual({
      type: "string",
    });
  });
});

describe("external Spec Compilation — Complex Inheritance & Nesting", () => {
  it("should handle deep model inheritance (blog DomainEvent pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model BaseEntity {
          id: string;
          createdAt: string;
          updatedAt: string;
        }

        model DomainEvent extends BaseEntity {
          eventId: string;
          eventType: string;
          aggregateId: string;
          occurredAt: string;
        }

        model CampaignCreatedEvent extends DomainEvent {
          eventType: "CampaignCreated";
          data: {
            name: string;
            type: string;
            budget: decimal128;
            startDate: string;
          };
        }

        @channel("campaign-events")
        @publish
        op publishCampaignEvent(): CampaignCreatedEvent;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "inheritance-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    validateAsyncAPIDocument(asyncApiDoc!);
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // Two-level inheritance: each level refs its base via allOf
    expect(schemas.CampaignCreatedEvent.allOf).toStrictEqual([
      { $ref: "#/components/schemas/DomainEvent" },
    ]);
    expect(schemas.DomainEvent.allOf).toStrictEqual([
      { $ref: "#/components/schemas/BaseEntity" },
    ]);
    // Derived models carry only their own properties
    expect(
      Object.keys(schemas.CampaignCreatedEvent.properties).toSorted(),
    ).toStrictEqual(["data", "eventType"]);
    expect(schemas.CampaignCreatedEvent.properties.eventType).toStrictEqual({
      const: "CampaignCreated",
    });
  });

  it("should handle deeply nested anonymous models (ActaFlow pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model Workflow {
          name: string;
          steps: Step[];
          config: {
            retries: int32;
            timeout: int32;
            metadata: {
              priority: string;
              tags: string[];
            };
          };
        }

        model Step {
          id: string;
          type: string;
          inputs: Record<string>;
        }

        @channel("workflows")
        @publish
        op publishWorkflow(): Workflow;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "nested-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    const { Workflow: workflow } = schemas;
    // Named array property refs the declared schema
    expect(workflow.properties.steps).toStrictEqual({
      items: { $ref: "#/components/schemas/Step" },
      type: "array",
    });
    // Nested anonymous models inline to arbitrary depth
    const { config } = workflow.properties;
    expect(config.properties.retries).toStrictEqual({
      format: "int32",
      type: "integer",
    });
    expect(config.properties.metadata.properties.priority).toStrictEqual({
      type: "string",
    });
    expect(config.properties.metadata.properties.tags).toStrictEqual({
      items: { type: "string" },
      type: "array",
    });
    // Record<string> value type on the nested Step model
    expect(schemas.Step.properties.inputs).toStrictEqual({
      additionalProperties: { type: "string" },
      type: "object",
    });
  });

  it("should handle Record types (eventsourcing Record<unknown> pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model Command {
          commandId: string;
          commandType: string;
          payload: Record<unknown>;
          metadata: Record<string>;
        }

        @channel("commands")
        @publish
        op publishCommand(): Command;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "record-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    validateAsyncAPIDocument(asyncApiDoc!);
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // Record<unknown> accepts any value; Record<string> narrows to strings
    expect(schemas.Command.properties.payload).toStrictEqual({
      additionalProperties: {},
      type: "object",
    });
    expect(schemas.Command.properties.metadata).toStrictEqual({
      additionalProperties: { type: "string" },
      type: "object",
    });
  });
});

describe("external Spec Compilation — Enums & Unions", () => {
  it("should handle enum with string values (Kernovia ActorType pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        enum ActorType {
          user: "user";
          bot: "bot";
          system: "system";
          service: "service";
        }

        enum AIProvider {
          openai: "openai";
          anthropic: "anthropic";
          google: "google";
        }

        model Actor {
          id: string;
          type: ActorType;
          provider: AIProvider;
        }

        @channel("actors")
        @publish
        op publishActor(): Actor;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "enum-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.ActorType.enum).toStrictEqual([
      "user",
      "bot",
      "system",
      "service",
    ]);
    expect(schemas.AIProvider.enum).toStrictEqual([
      "openai",
      "anthropic",
      "google",
    ]);
  });

  it("should handle discriminated unions (eventsourcing result pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model SuccessResult {
          status: "success";
          data: string;
        }

        model ErrorResult {
          status: "error";
          message: string;
          code: int32;
        }

        union ExecutionResult {
          success: SuccessResult;
          error: ErrorResult;
        }

        @channel("results")
        @publish
        op publishResult(): ExecutionResult;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "union-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    validateAsyncAPIDocument(asyncApiDoc!);
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // All-Model variants compose an exclusive oneOf of refs
    expect(schemas.ExecutionResult.oneOf).toStrictEqual([
      { $ref: "#/components/schemas/SuccessResult" },
      { $ref: "#/components/schemas/ErrorResult" },
    ]);
    expect(schemas.SuccessResult.properties.status).toStrictEqual({
      const: "success",
    });
    expect(schemas.ErrorResult.properties.status).toStrictEqual({
      const: "error",
    });
  });
});

describe("external Spec Compilation — Multi-message & Multi-server", () => {
  it("should handle multiple message types on one channel (eventsourcing pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model UserCreated {
          userId: string;
          name: string;
          email: string;
        }

        model UserUpdated {
          userId: string;
          fields: Record<string>;
        }

        model UserDeleted {
          userId: string;
          reason: string;
        }

        @message({ title: "User Created" })
        model UserCreatedMessage extends UserCreated {}

        @message({ title: "User Updated" })
        model UserUpdatedMessage extends UserUpdated {}

        @message({ title: "User Deleted" })
        model UserDeletedMessage extends UserDeleted {}

        @channel("users")
        @publish
        op publishCreated(): UserCreatedMessage;

        @channel("users")
        @publish
        op publishUpdated(): UserUpdatedMessage;

        @channel("users")
        @publish
        op publishDeleted(): UserDeletedMessage;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "multi-message-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const channel = (asyncApiDoc?.channels ?? {}) as Record<string, any>;
    expect(Object.keys(channel.users.messages).toSorted()).toStrictEqual([
      "UserCreatedMessage",
      "UserDeletedMessage",
      "UserUpdatedMessage",
    ]);
    expect(channel.users.messages.UserCreatedMessage).toStrictEqual({
      $ref: "#/components/messages/UserCreatedMessage",
    });
    const messages = (asyncApiDoc?.components?.messages ?? {}) as Record<
      string,
      any
    >;
    expect(messages.UserCreatedMessage.name).toBe("User Created");
    expect(messages.UserCreatedMessage.payload).toStrictEqual({
      $ref: "#/components/schemas/UserCreatedMessage",
    });
    // The @message wrapper composes its base via allOf
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.UserCreatedMessage.allOf).toStrictEqual([
      { $ref: "#/components/schemas/UserCreated" },
    ]);
  });

  it("should handle multiple @server decorators on one namespace", async () => {
    const source = `
      @server("kafka-prod", #{ url: "kafka://prod-broker:9092", protocol: "kafka" })
      @server("mqtt-prod", #{ url: "mqtt://prod-mqtt:1883", protocol: "mqtt" })
      @server("ws-prod", #{ url: "wss://prod-ws:443", protocol: "wss" })
      namespace Test;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "multi-protocol-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const servers = (asyncApiDoc?.servers ?? {}) as Record<string, any>;
    const serverNames = Object.keys(servers);
    expect(serverNames).toHaveLength(3);
    expect(servers["kafka-prod"].protocol).toBe("kafka");
    expect(servers["mqtt-prod"].protocol).toBe("mqtt");
    // The wss protocol stays distinct on servers (only binding keys normalize to ws)
    expect(servers["ws-prod"].protocol).toBe("wss");
  });
});

describe("external Spec Compilation — Edge Cases from Real Specs", () => {
  it("should handle empty models (minimal definition pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model Empty {}

        model WithOnlyOptional {
          name?: string;
          description?: string;
        }

        @channel("edge")
        @publish
        op publishEmpty(): Empty;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "edge-empty",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    // Empty model emits an object with no properties and no required list
    expect(schemas.Empty).toStrictEqual({ properties: {}, type: "object" });
    // All-optional model keeps its properties but omits required
    expect(schemas.WithOnlyOptional.properties.name).toStrictEqual({
      type: "string",
    });
    expect(schemas.WithOnlyOptional.required).toBeUndefined();
  });

  it("should handle arrays of named models (common pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model Item {
          id: string;
          name: string;
          price: decimal128;
        }

        model Order {
          orderId: string;
          items: Item[];
          total: decimal128;
        }

        @channel("orders")
        @publish
        op publishOrder(): Order;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "array-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.Order?.properties?.items).not.toBeNull();
    const itemsProp = schemas.Order.properties.items;
    expect(itemsProp.items?.$ref).toBe("#/components/schemas/Item");
    expect(itemsProp.type).toBe("array");
    expect(schemas.Item.properties.price).toStrictEqual({
      format: "decimal",
      type: "string",
    });
  });

  it("should handle models with default values (Kernovia BaseCommand pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model BaseCommand {
          commandId: string;
          commandType: string;
          commandVersion: string = "1.0.0";
          priority: int32 = 5;
          active: boolean = true;
        }

        @channel("commands")
        @publish
        op publishCommand(): BaseCommand;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "defaults-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    const props = schemas.BaseCommand.properties;
    expect(props.commandVersion.default).toBe("1.0.0");
    expect(props.priority.default).toBe(5);
    expect(props.active.default).toBe(true);
    expect(props.commandId.default).toBeUndefined();
  });

  it("should handle nullable types and optional properties (ActaFlow pattern)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model User {
          id: string;
          name?: string;
          email: string | null;
          phone?: string | null;
          metadata?: Record<string>;
        }

        @channel("users")
        @publish
        op publishUser(): User;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "nullable-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    validateAsyncAPIDocument(asyncApiDoc!);
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    const user = schemas.User;
    // `T | null` composes anyOf with a null variant (not a duplicate string)
    expect(user.properties.email.anyOf).toStrictEqual([
      { type: "string" },
      { type: "null" },
    ]);
    // Optional properties are absent from required
    expect(user.required).toStrictEqual(["id", "email"]);
    expect(user.properties.metadata).toStrictEqual({
      additionalProperties: { type: "string" },
      type: "object",
    });
  });
});

describe("external Spec Compilation — Failure Resilience", () => {
  it("should not crash on extremely large models", async () => {
    const fields = Array.from(
      { length: 50 },
      (_, i) => `field${i}: string;`,
    ).join("\n    ");
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model LargeModel {
          ${fields}
        }

        @channel("large")
        @publish
        op publishLarge(): LargeModel;
      }
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "stress-test",
    });

    expect(asyncApiDoc).not.toBeNull();
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.LargeModel?.properties).not.toBeNull();
    const propCount = Object.keys(schemas.LargeModel.properties).length;
    expect(propCount).toBe(50);
  });

  it("should produce diagnostics array on raw compilation (not crash)", async () => {
    const source = `
      @server("test", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace Test {
        model Event { id: string; }

        @channel("events")
        @publish
        op publishEvent(): Event;
      }
    `;

    const { diagnostics } = await compileAsyncAPISpecRaw(source, {
      "file-type": "json",
      "output-file": "raw-test",
    });

    expect(diagnostics).not.toBeNull();
    expect(Array.isArray(diagnostics)).toBeTruthy();
    // A valid spec must compile without error diagnostics
    expect(diagnostics.filter((d) => d.severity === "error")).toHaveLength(0);
  });
});
