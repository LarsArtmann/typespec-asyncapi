/**
 * Kafka Protocol Tests
 *
 * Verifies that Kafka-specific protocol configurations are properly emitted
 * via the @protocol decorator.
 */

import { inlineObject } from "../utils/type-guards.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

async function compileAndGetDoc(source: string) {
  return compileAndValidateOrThrow(source);
}

describe("kafka Protocol", () => {
  it("should emit Kafka channel bindings for operations with @protocol", async () => {
    const doc = await compileAndGetDoc(`
      @channel("kafka-events")
      @protocol(#{
        protocol: "kafka",
        partitions: 3,
        replicationFactor: 2
      })
      @publish
      op publishKafkaEvent(): KafkaEvent;

      model KafkaEvent { id: string; }
    `);

    const channel = doc.channels?.["kafka-events"];
    expect(channel).toBeDefined();
    expect(channel.bindings).toBeDefined();
    expect(inlineObject(channel.bindings, "bindings").kafka).toBeDefined();
  });

  it("should emit Kafka bindings with protocol-specific fields", async () => {
    const doc = await compileAndGetDoc(`
      @channel("kafka-topic")
      @protocol(#{
        protocol: "kafka",
        partitions: 10,
        replicationFactor: 3,
        consumerGroup: "my-service"
      })
      @publish
      op publishToTopic(): Event;

      model Event { id: string; data: string; }
    `);

    const channel = doc.channels?.["kafka-topic"];
    expect(inlineObject(channel.bindings, "bindings").kafka).toBeDefined();
  });

  it("should support multiple operations with different protocols", async () => {
    const doc = await compileAndGetDoc(`
      @channel("kafka-stream")
      @protocol(#{
        protocol: "kafka",
        partitions: 5
      })
      @publish
      op publishKafka(): Event;

      @channel("ws-stream")
      @protocol(#{
        protocol: "ws",
        binding: #{ method: "GET" }
      })
      @subscribe
      op subscribeWs(): Event;

      model Event { id: string; }
    `);

    expect(
      inlineObject(doc.channels?.["kafka-stream"]?.bindings, "bindings").kafka
        .partitions,
    ).toBe(5);
    expect(
      inlineObject(doc.channels?.["ws-stream"]?.bindings, "bindings").ws.method,
    ).toBe("GET");
  });

  it("should not fabricate bindings when no fields are written", async () => {
    const doc = await compileAndGetDoc(`
      @channel("default-kafka")
      @protocol(#{
        protocol: "kafka"
      })
      @publish
      op publishDefault(): Event;

      model Event { id: string; }
    `);

    const channel = doc.channels?.["default-kafka"];
    expect(channel.bindings).toBeUndefined();
  });
});
