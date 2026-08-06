/**
 * AsyncAPI 3.1.0 Spec Compliance: reusable components.*
 *
 * Tests that the emitter populates components.* maps from the new
 * reusable component decorators:
 *   - operationTraits (@operationTrait + @useOperationTrait)
 *   - messageTraits (@messageTrait + @useMessageTrait)
 *   - parameters (@parameter + auto-ref from channel addresses)
 *   - correlationIds (@reusableCorrelationId + @useCorrelationId)
 *   - operationBindings / messageBindings (@reusableBinding + @useBinding)
 */

import { compileAndValidateOrThrow, compileAndValidate } from "../utils/schema-validator.js";
import type {
  CorrelationIdObject,
  MessageObject,
  MessageTraitObject,
  OperationObject,
  OperationTraitObject,
  ParameterObject,
} from "../../src/domain/models/asyncapi-document.js";

describe("components.operationTraits compliance", () => {
  it("populates components.operationTraits from @operationTrait", async () => {
    const doc = await compileAndValidateOrThrow(`
      @operationTrait("standard", #{ description: "Standard operation" })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.operationTraits?.standard).toStrictEqual({
      description: "Standard operation",
    } as OperationTraitObject);
  });

  it("references operation traits via @useOperationTrait", async () => {
    const doc = await compileAndValidateOrThrow(`
      @operationTrait("base", #{ summary: "Base ops" })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useOperationTrait("base")
      op publish(): Event;
    `);

    const op = doc.operations!.publish as OperationObject;
    expect(op.traits).toBeDefined();
    expect(op.traits).toHaveLength(1);
    expect(op.traits![0]).toStrictEqual({
      $ref: "#/components/operationTraits/base",
    });
  });

  it("supports multiple operation traits on a namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @operationTrait("secure", #{ description: "Secured" })
      @operationTrait("monitored", #{ description: "Monitored" })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useOperationTrait("secure")
      @useOperationTrait("monitored")
      op publish(): Event;
    `);

    expect(Object.keys(doc.components!.operationTraits!).toSorted()).toStrictEqual([
      "monitored",
      "secure",
    ]);
    const op = doc.operations!.publish as OperationObject;
    expect(op.traits).toHaveLength(2);
  });
});

describe("components.messageTraits compliance", () => {
  it("populates components.messageTraits from @messageTrait", async () => {
    const doc = await compileAndValidateOrThrow(`
      @messageTrait("json", #{ contentType: "application/json", description: "JSON msg" })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.messageTraits?.json).toStrictEqual({
      name: "json",
      contentType: "application/json",
      description: "JSON msg",
    } as MessageTraitObject);
  });

  it("references message traits via @useMessageTrait", async () => {
    const doc = await compileAndValidateOrThrow(`
      @messageTrait("base", #{ description: "Base message" })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const msg = doc.components!.messages!.Event as MessageObject;
    expect(msg.traits).toBeUndefined();

    const doc2 = await compileAndValidateOrThrow(`
      @messageTrait("base", #{ description: "Base message" })
      namespace Test;
      @useMessageTrait("base")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const msg2 = doc2.components!.messages!.Event as MessageObject;
    expect(msg2.traits).toBeDefined();
    expect(msg2.traits).toHaveLength(1);
    expect(msg2.traits![0]).toStrictEqual({
      $ref: "#/components/messageTraits/base",
    });
  });
});

describe("components.parameters compliance", () => {
  it("populates components.parameters from @parameter", async () => {
    const doc = await compileAndValidateOrThrow(`
      @parameter("orderId", #{ description: "The order ID" })
      namespace Test;
      model Event { id: string; }
      @channel("orders/{orderId}")
      op publish(): Event;
    `);

    expect(doc.components?.parameters?.orderId).toStrictEqual({
      description: "The order ID",
    } as ParameterObject);
  });

  it("upgrades channel parameters to $ref when reusable parameter exists", async () => {
    const doc = await compileAndValidateOrThrow(`
      @parameter("userId", #{ description: "User identifier", location: "$message.payload#/userId" })
      namespace Test;
      model Event { id: string; }
      @channel("users/{userId}/events")
      op publish(): Event;
    `);

    const channel = doc.channels!["users/{userId}/events"];
    expect(channel.parameters).toBeDefined();
    expect(channel.parameters!.userId).toStrictEqual({
      $ref: "#/components/parameters/userId",
    });
  });

  it("keeps inline parameters when no reusable parameter matches", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("users/{userId}/events")
      op publish(): Event;
    `);

    const channel = doc.channels!["users/{userId}/events"];
    expect(channel.parameters!.userId).toStrictEqual({
      description: "Channel parameter: userId",
    });
    expect(doc.components?.parameters).toBeUndefined();
  });

  it("extracts default and examples from @parameter config", async () => {
    const doc = await compileAndValidateOrThrow(`
      @parameter("status", #{
        description: "Filter by status",
        default: "active",
        examples: #["active"]
      })
      namespace Test;
      model Event { id: string; }
      @channel("orders/{status}")
      op publish(): Event;
    `);

    const param = doc.components?.parameters?.status as ParameterObject;
    expect(param.description).toBe("Filter by status");
    expect(param.default).toBe("active");
    expect(param.examples).toStrictEqual(["active"]);
  });
});

describe("components.correlationIds compliance (reusable)", () => {
  it("populates components.correlationIds from @reusableCorrelationId", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableCorrelationId("default", "$message.header#/correlationId")
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.correlationIds?.default).toStrictEqual({
      location: "$message.header#/correlationId",
    } as CorrelationIdObject);
  });

  it("references reusable correlation IDs via @useCorrelationId", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableCorrelationId("default", "$message.header#/correlationId")
      namespace Test;
      @useCorrelationId("default")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const msg = doc.components!.messages!.Event as MessageObject;
    expect(msg.correlationId).toStrictEqual({
      $ref: "#/components/correlationIds/default",
    });
  });

  it("inline @correlationId still works without components.correlationIds", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @correlationId("$message.header#/correlationId")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const msg = doc.components!.messages!.Event as MessageObject;
    expect(msg.correlationId).toStrictEqual({
      location: "$message.header#/correlationId",
    });
    expect(doc.components?.correlationIds).toBeUndefined();
  });
});

describe("reusable bindings compliance", () => {
  it("populates components.operationBindings from @reusableBinding + @useBinding", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableBinding("kafkaStd", #{ kafka: #{ clientId: #{ type: "string" }, bindingVersion: "0.5.0" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useBinding("kafkaStd")
      op publish(): Event;
    `);

    expect(doc.components?.operationBindings?.kafkaStd).toBeDefined();
    expect(doc.components!.operationBindings!.kafkaStd.kafka).toBeDefined();
    expect(
      (doc.components!.operationBindings!.kafkaStd.kafka as Record<string, unknown>).clientId,
    ).toStrictEqual({ type: "string" });

    const op = doc.operations!.publish as OperationObject;
    expect(op.bindings).toStrictEqual({
      $ref: "#/components/operationBindings/kafkaStd",
    });
  });

  it("populates components.messageBindings from @useBinding on model", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableBinding("msgKafka", #{ kafka: #{ bindingVersion: "0.5.0" } })
      namespace Test;
      @useBinding("msgKafka")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.messageBindings?.msgKafka).toBeDefined();
    const msg = doc.components!.messages!.Event as MessageObject;
    expect(msg.bindings).toStrictEqual({
      $ref: "#/components/messageBindings/msgKafka",
    });
  });

  it("does not emit components.*Bindings when no reusable bindings used", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.operationBindings).toBeUndefined();
    expect(doc.components?.messageBindings).toBeUndefined();
    expect(doc.components?.serverBindings).toBeUndefined();
  });

  it("populates components.serverBindings from @useBinding on namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableBinding("srvKafka", #{ kafka: #{ bindingVersion: "0.5.0" } })
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      @useBinding("srvKafka")
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.serverBindings?.srvKafka).toBeDefined();
    expect(doc.servers?.prod.bindings).toStrictEqual({
      $ref: "#/components/serverBindings/srvKafka",
    });
  });

  it("does not crash when @useBinding targets namespace with no servers", async () => {
    const doc = await compileAndValidateOrThrow(`
      @reusableBinding("orphan", #{ kafka: #{ bindingVersion: "0.5.0" } })
      @useBinding("orphan")
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers).toBeUndefined();
    expect(doc.components?.serverBindings?.orphan).toBeDefined();
  });
});

describe("operation trait richer fields", () => {
  it("extracts security from @operationTrait config", async () => {
    const result = await compileAndValidate(`
      @operationTrait("secure", #{
        description: "Secured operation",
        security: #[#{ userPassword: #[] }]
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const trait = result.document.components?.operationTraits?.secure as OperationTraitObject;
    expect(trait.description).toBe("Secured operation");
    expect(trait.security).toStrictEqual([{ userPassword: [] }]);
  });

  it("extracts tags and bindings from @operationTrait config", async () => {
    const doc = await compileAndValidateOrThrow(`
      @operationTrait("rich", #{
        summary: "Rich trait",
        tags: #[#{ name: "production" }],
        bindings: #{ kafka: #{ bindingVersion: "0.5.0" } }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const trait = doc.components?.operationTraits?.rich as OperationTraitObject;
    expect(trait.summary).toBe("Rich trait");
    expect(trait.tags).toStrictEqual([{ name: "production" }]);
    expect(trait.bindings).toBeDefined();
  });
});

describe("message trait richer fields", () => {
  it("extracts headers from @messageTrait config", async () => {
    const doc = await compileAndValidateOrThrow(`
      @messageTrait("common", #{
        contentType: "application/json",
        headers: #{
          type: "object",
          properties: #{
            traceId: #{ type: "string" }
          }
        }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const trait = doc.components?.messageTraits?.common as MessageTraitObject;
    expect(trait.contentType).toBe("application/json");
    expect(trait.headers).toBeDefined();
    expect((trait.headers as Record<string, unknown>).type).toBe("object");
  });

  it("extracts correlationId from @messageTrait config", async () => {
    const doc = await compileAndValidateOrThrow(`
      @messageTrait("tracked", #{
        correlationId: #{
          location: "$message.header#/correlationId"
        }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const trait = doc.components?.messageTraits?.tracked as MessageTraitObject;
    expect(trait.correlationId).toStrictEqual({
      location: "$message.header#/correlationId",
    });
  });

  it("extracts summary from @messageTrait config", async () => {
    const doc = await compileAndValidateOrThrow(`
      @messageTrait("summarized", #{
        summary: "Short description"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const trait = doc.components?.messageTraits?.summarized as MessageTraitObject;
    expect(trait.summary).toBe("Short description");
  });
});
