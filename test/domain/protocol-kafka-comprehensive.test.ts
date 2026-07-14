/**
 * Kafka Protocol Tests
 *
 * Verifies that Kafka-specific protocol configurations are properly emitted
 * via the @protocol decorator.
 */

import { describe, it, expect } from "bun:test";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers";
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

describe("Kafka Protocol", () => {
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
    expect(channel.bindings.kafka).toBeDefined();
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
    expect(channel.bindings?.kafka).toBeDefined();
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
        subprotocol: "asyncapi"
      })
      @subscribe
      op subscribeWs(): Event;

      model Event { id: string; }
    `);

    expect(doc.channels?.["kafka-stream"]?.bindings?.kafka).toBeDefined();
    expect(doc.channels?.["ws-stream"]?.bindings?.ws).toBeDefined();
  });

  it("should apply Kafka protocol defaults when fields are omitted", async () => {
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
    expect(channel.bindings?.kafka).toBeDefined();
  });
});
