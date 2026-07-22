/**
 * AsyncAPI 3.1.0 Spec Compliance: Google Pub/Sub and SNS Protocol Bindings
 *
 * Validates that Google Pub/Sub and SNS bindings produce output that
 * validates against the official AsyncAPI 3.1.0 JSON Schema.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: Google Pub/Sub Bindings", () => {
  it("emits valid Google Pub/Sub channel binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "googlepubsub",
        binding: #{
          messageRetentionDuration: "600s",
          schemaSettings: #{ encoding: "json", name: "projects/test/schemas/event" }
        }
      })
      op publish(): Event;
    `);

    const binding = doc.channels!["events"].bindings!;
    expect(binding.googlepubsub).toBeDefined();
    expect(binding.googlepubsub.messageRetentionDuration).toBe("600s");
    expect(binding.googlepubsub.bindingVersion).toBe("0.2.0");
  });

  it("emits valid Google Pub/Sub message binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @bindings(#{
        googlepubsub: #{
          orderingKey: "partition-1"
        }
      })
      model PubSubEvent { id: string; }
      @channel("events")
      op publish(): PubSubEvent;
    `);

    const msg = doc.components!.messages!.PubSubEvent;
    expect(msg).toBeDefined();
    const msgObj = msg as {
      bindings?: Record<string, Record<string, unknown>>;
    };
    expect(msgObj.bindings).toBeDefined();
    expect(msgObj.bindings!.googlepubsub).toBeDefined();
    expect(msgObj.bindings!.googlepubsub.orderingKey).toBe("partition-1");
    expect(msgObj.bindings!.googlepubsub.bindingVersion).toBe("0.2.0");
  });

  it("accepts Google Pub/Sub as server protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("pubsub", #{
        url: "pubsub.googleapis.com",
        protocol: "googlepubsub"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers!.pubsub.protocol).toBe("googlepubsub");
  });
});

describe("spec Compliance: SNS Bindings", () => {
  it("emits valid SNS channel binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("notifications")
      @protocol(#{
        protocol: "sns",
        binding: #{
          name: "my-topic"
        }
      })
      op publish(): Event;
    `);

    const binding = doc.channels!.notifications.bindings!;
    expect(binding.sns).toBeDefined();
    expect(binding.sns.name).toBe("my-topic");
    expect(binding.sns.bindingVersion).toBe("0.1.0");
  });

  it("emits valid SNS operation binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("notifications")
      @bindings(#{
        sns: #{
          topic: #{ type: "string" },
          consumers: #[#{
            endpoint: #{ type: "string" },
            rawMessageDelivery: true
          }]
        }
      })
      op publish(): Event;
    `);

    const [op] = Object.values(doc.operations!);
    expect(op.bindings).toBeDefined();
    expect(op.bindings!.sns).toBeDefined();
    expect(op.bindings!.sns.topic).toBeDefined();
    expect(op.bindings!.sns.consumers).toBeDefined();
    expect(op.bindings!.sns.bindingVersion).toBe("0.1.0");
  });

  it("accepts SNS as server protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("sns", #{
        url: "sns.us-east-1.amazonaws.com",
        protocol: "sns"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers!.sns.protocol).toBe("sns");
  });
});

describe("spec Compliance: Redis Protocol", () => {
  it("accepts Redis as server protocol (no binding definitions)", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("redis", #{
        url: "redis://localhost:6379",
        protocol: "redis"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers!.redis.protocol).toBe("redis");
  });
});
