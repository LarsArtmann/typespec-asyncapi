/**
 * Tests: Binding Field-Level Validation
 *
 * Verifies that processBindings() catches invalid field values
 * like wrong types, out-of-range numbers, and invalid enum values.
 */

import { processBindings } from "../../src/validation/binding-validator.js";

describe("binding field validation", () => {
  it("catches invalid MQTT qos value", () => {
    const { issues } = processBindings(
      { mqtt: { qos: 99 } },
      "operation",
    );
    const qosIssue = issues.find((i) => i.format.field === "qos");
    expect(qosIssue).toBeDefined();
    expect(qosIssue!.code).toBe("invalid-binding-field");
  });

  it("accepts valid MQTT qos values", () => {
    for (const qos of [0, 1, 2]) {
      const { issues } = processBindings(
        { mqtt: { qos } },
        "operation",
      );
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
      const { issues } = processBindings(
        { http: { method } },
        "operation",
      );
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
    const { issues } = processBindings(
      { mqtt: { qos: 999 } },
    );
    const qosIssue = issues.find((i) => i.format.field === "qos");
    expect(qosIssue).toBeUndefined();
  });
});
