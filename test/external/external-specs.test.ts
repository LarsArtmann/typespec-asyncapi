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
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.CampaignCreatedEvent).not.toBeNull();
    expect(schemas.CampaignCreatedEvent.type).toBe("object");
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
    expect(schemas.Workflow).not.toBeNull();
    expect(schemas.Workflow.type).toBe("object");
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
    const schemas = (asyncApiDoc?.components?.schemas ?? {}) as Record<
      string,
      any
    >;
    expect(schemas.Command).not.toBeNull();
    expect(schemas.Command.type).toBe("object");
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
    expect(schemas.ActorType).not.toBeNull();
    expect(schemas.ActorType.enum).not.toBeNull();
    expect(schemas.ActorType.enum.length).toBeGreaterThan(0);
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
    expect(servers["kafka-prod"]).not.toBeNull();
    expect(servers["mqtt-prod"]).not.toBeNull();
    expect(servers["ws-prod"]).not.toBeNull();
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
    expect(itemsProp.items?.$ref).toContain("Item");
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
  });
});
