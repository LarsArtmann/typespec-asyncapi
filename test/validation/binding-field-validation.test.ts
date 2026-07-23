/**
 * Tests: Binding Field-Level Validation
 *
 * Verifies that processBindings() catches invalid field values
 * like wrong types, out-of-range numbers, and invalid enum values.
 */

import { processBindings } from "../../src/validation/binding-validator.js";

describe("binding field validation", () => {
  it("catches invalid MQTT qos value", () => {
    const { issues } = processBindings({ mqtt: { qos: 99 } }, "operation");
    const qosIssue = issues.find((i) => i.format.field === "qos");
    expect(qosIssue).toBeDefined();
    expect(qosIssue!.code).toBe("invalid-binding-field");
  });

  it("accepts valid MQTT qos values", () => {
    for (const qos of [0, 1, 2]) {
      const { issues } = processBindings({ mqtt: { qos } }, "operation");
      const qosIssue = issues.find((i) => i.format.field === "qos");
      expect(qosIssue).toBeUndefined();
    }
  });

  it("catches invalid HTTP method", () => {
    const { issues } = processBindings(
      { http: { method: "INVALID" } },
      "operation",
    );
    const methodIssue = issues.find((i) => i.format.field === "method");
    expect(methodIssue).toBeDefined();
    expect(methodIssue!.code).toBe("invalid-binding-field");
  });

  it("accepts valid HTTP methods", () => {
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      const { issues } = processBindings({ http: { method } }, "operation");
      const methodIssue = issues.find((i) => i.format.field === "method");
      expect(methodIssue).toBeUndefined();
    }
  });

  it("catches wrong type for Kafka partitions", () => {
    const { issues } = processBindings(
      { kafka: { partitions: "three" } },
      "channel",
    );
    const partitionsIssue = issues.find((i) => i.format.field === "partitions");
    expect(partitionsIssue).toBeDefined();
  });

  it("catches negative Kafka partitions", () => {
    const { issues } = processBindings(
      { kafka: { partitions: -1 } },
      "channel",
    );
    const partitionsIssue = issues.find((i) => i.format.field === "partitions");
    expect(partitionsIssue).toBeDefined();
  });

  it("catches invalid AMQP deliveryMode", () => {
    const { issues } = processBindings(
      { amqp: { deliveryMode: 5 } },
      "operation",
    );
    const deliveryIssue = issues.find((i) => i.format.field === "deliveryMode");
    expect(deliveryIssue).toBeDefined();
  });

  it("catches wrong type for AMQP priority", () => {
    const { issues } = processBindings(
      { amqp: { priority: "high" } },
      "operation",
    );
    const priorityIssue = issues.find((i) => i.format.field === "priority");
    expect(priorityIssue).toBeDefined();
  });

  it("does not report issues for valid bindings", () => {
    const { issues } = processBindings(
      {
        kafka: {
          topic: "events",
          partitions: 3,
          replicas: 2,
        },
      },
      "channel",
    );
    expect(issues).toStrictEqual([]);
  });

  it("does not validate when targetKind is undefined", () => {
    const { issues } = processBindings({ mqtt: { qos: 999 } });
    const qosIssue = issues.find((i) => i.format.field === "qos");
    expect(qosIssue).toBeUndefined();
  });

  it("warns on unknown binding protocol", () => {
    const { issues, bindings } = processBindings({ fakeproto: { foo: "bar" } });
    const unknownIssue = issues.find(
      (i) => i.code === "unknown-binding-protocol",
    );
    expect(unknownIssue).toBeDefined();
    expect(bindings.fakeproto).toStrictEqual({ foo: "bar" });
  });

  it("warns on misplaced binding", () => {
    const { issues } = processBindings({ sns: { topic: "test" } }, "message");
    const misplaced = issues.find((i) => i.code === "misplaced-binding");
    expect(misplaced).toBeDefined();
    expect(misplaced!.format.protocol).toBe("sns");
    expect(misplaced!.format.targetKind).toBe("message");
  });

  it("warns on invalid binding version string", () => {
    const { issues } = processBindings(
      { kafka: { bindingVersion: "99.0.0" } },
      "channel",
    );
    const versionIssue = issues.find(
      (i) => i.code === "invalid-binding-version",
    );
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("99.0.0");
  });

  it("coerces numeric bindingVersion to string", () => {
    const { issues } = processBindings(
      { kafka: { bindingVersion: 99 } },
      "channel",
    );
    const versionIssue = issues.find(
      (i) => i.code === "invalid-binding-version",
    );
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("99");
  });

  it("handles non-object binding value gracefully", () => {
    const { bindings, issues } = processBindings(
      { kafka: "not-an-object" },
      "channel",
    );
    expect(bindings.kafka).toBeDefined();
    expect(bindings.kafka.bindingVersion).toBeDefined();
    const fieldIssues = issues.filter(
      (i) => i.code === "invalid-binding-field",
    );
    expect(fieldIssues).toHaveLength(0);
  });

  it("handles object bindingVersion (non-string, non-number)", () => {
    const { issues } = processBindings(
      { kafka: { bindingVersion: { nested: true } } },
      "channel",
    );
    const versionIssue = issues.find(
      (i) => i.code === "invalid-binding-version",
    );
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("[object]");
  });

  it("normalizes websocket alias to ws binding key", () => {
    const { bindings } = processBindings(
      { websockets: { bindingVersion: "0.1.0" } },
      "channel",
    );
    expect(bindings.ws).toBeDefined();
    expect(bindings.ws.bindingVersion).toBe("0.1.0");
  });

  it("auto-injects bindingVersion when missing", () => {
    const { bindings } = processBindings(
      { kafka: { topic: "events" } },
      "channel",
    );
    expect(bindings.kafka.bindingVersion).toBe("0.5.0");
  });

  it("normalizes wss to ws binding key", () => {
    const { bindings } = processBindings(
      { wss: { bindingVersion: "0.1.0" } },
      "channel",
    );
    expect(bindings.ws).toBeDefined();
  });
});
