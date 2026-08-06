/**
 * Tests: Binding Field-Level Validation
 *
 * Verifies that processBindings() catches invalid field values
 * like wrong types, out-of-range numbers, and invalid enum values.
 */

import { processBindings } from "../../src/validation/binding-validator.js";
import { validateBindingFields } from "../../src/validation/binding-field-validator.js";

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
    const { issues } = processBindings({ http: { method: "INVALID" } }, "operation");
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
    const { issues } = processBindings({ kafka: { partitions: "three" } }, "channel");
    const partitionsIssue = issues.find((i) => i.format.field === "partitions");
    expect(partitionsIssue).toBeDefined();
  });

  it("catches negative Kafka partitions", () => {
    const { issues } = processBindings({ kafka: { partitions: -1 } }, "channel");
    const partitionsIssue = issues.find((i) => i.format.field === "partitions");
    expect(partitionsIssue).toBeDefined();
  });

  it("catches invalid AMQP deliveryMode", () => {
    const { issues } = processBindings({ amqp: { deliveryMode: 5 } }, "operation");
    const deliveryIssue = issues.find((i) => i.format.field === "deliveryMode");
    expect(deliveryIssue).toBeDefined();
  });

  it("catches wrong type for AMQP priority", () => {
    const { issues } = processBindings({ amqp: { priority: "high" } }, "operation");
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
    const unknownIssue = issues.find((i) => i.code === "unknown-binding-protocol");
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
    const { issues } = processBindings({ kafka: { bindingVersion: "99.0.0" } }, "channel");
    const versionIssue = issues.find((i) => i.code === "invalid-binding-version");
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("99.0.0");
  });

  it("coerces numeric bindingVersion to string", () => {
    const { issues } = processBindings({ kafka: { bindingVersion: 99 } }, "channel");
    const versionIssue = issues.find((i) => i.code === "invalid-binding-version");
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("99");
  });

  it("handles non-object binding value gracefully", () => {
    const { bindings, issues } = processBindings({ kafka: "not-an-object" }, "channel");
    expect(bindings.kafka).toBeDefined();
    expect(bindings.kafka.bindingVersion).toBeDefined();
    const fieldIssues = issues.filter((i) => i.code === "invalid-binding-field");
    expect(fieldIssues).toHaveLength(0);
  });

  it("handles object bindingVersion (non-string, non-number)", () => {
    const { issues } = processBindings({ kafka: { bindingVersion: { nested: true } } }, "channel");
    const versionIssue = issues.find((i) => i.code === "invalid-binding-version");
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.format.version).toBe("[object]");
  });

  it("normalizes websocket alias to ws binding key", () => {
    const { bindings } = processBindings({ websockets: { bindingVersion: "0.1.0" } }, "channel");
    expect(bindings.ws).toBeDefined();
    expect(bindings.ws.bindingVersion).toBe("0.1.0");
  });

  it("auto-injects bindingVersion when missing", () => {
    const { bindings } = processBindings({ kafka: { topic: "events" } }, "channel");
    expect(bindings.kafka.bindingVersion).toBe("0.5.0");
  });

  it("normalizes wss to ws binding key", () => {
    const { bindings } = processBindings({ wss: { bindingVersion: "0.1.0" } }, "channel");
    expect(bindings.ws).toBeDefined();
  });

  it("catches value exceeding max constraint (IBM MQ maxMsgLength)", () => {
    const { issues } = processBindings({ ibmmq: { maxMsgLength: 104_857_601 } }, "channel");
    const maxIssue = issues.find((i) => i.format.field === "maxMsgLength");
    expect(maxIssue).toBeDefined();
    expect(maxIssue!.code).toBe("invalid-binding-field");
    expect(maxIssue!.format.max).toBe(104_857_600);
  });

  it("accepts value within max constraint (IBM MQ maxMsgLength)", () => {
    const { issues } = processBindings({ ibmmq: { maxMsgLength: 1024 } }, "channel");
    const maxIssue = issues.find((i) => i.format.field === "maxMsgLength");
    expect(maxIssue).toBeUndefined();
  });

  it("catches value below min constraint (IBM MQ maxMsgLength)", () => {
    const { issues } = processBindings({ ibmmq: { maxMsgLength: -1 } }, "channel");
    const minIssue = issues.find((i) => i.format.field === "maxMsgLength");
    expect(minIssue).toBeDefined();
    expect(minIssue!.format.min).toBe(0);
  });

  it("returns no issues for protocol not in field rules (direct call)", () => {
    const issues = validateBindingFields("fakeProto", "channel", {
      someField: "value",
    });
    expect(issues).toStrictEqual([]);
  });

  it("returns no issues for target kind without rules (direct call)", () => {
    const issues = validateBindingFields("kafka", "server", {
      groupId: "test",
    });
    expect(issues).toStrictEqual([]);
  });

  describe("binding-only protocols (solace, anypointmq, ros2)", () => {
    it("accepts solace binding on operation target", () => {
      const { issues, bindings } = processBindings({ solace: { priority: 5 } }, "operation");
      const solaceIssues = issues.filter((i) => i.format.protocol === "solace");
      expect(solaceIssues).toHaveLength(0);
      expect(bindings.solace).toBeDefined();
      expect(bindings.solace.bindingVersion).toBe("0.4.0");
    });

    it("catches solace priority exceeding max (255)", () => {
      const { issues } = processBindings({ solace: { priority: 999 } }, "operation");
      const priorityIssue = issues.find((i) => i.format.field === "priority");
      expect(priorityIssue).toBeDefined();
      expect(priorityIssue!.code).toBe("invalid-binding-field");
      expect(priorityIssue!.format.max).toBe(255);
    });

    it("catches solace priority below min (0)", () => {
      const { issues } = processBindings({ solace: { priority: -1 } }, "operation");
      const priorityIssue = issues.find((i) => i.format.field === "priority");
      expect(priorityIssue).toBeDefined();
      expect(priorityIssue!.format.min).toBe(0);
    });

    it("catches solace priority wrong type", () => {
      const { issues } = processBindings({ solace: { priority: "high" } }, "operation");
      const priorityIssue = issues.find((i) => i.format.field === "priority");
      expect(priorityIssue).toBeDefined();
    });

    it("accepts solace on server target", () => {
      const { issues, bindings } = processBindings(
        { solace: { msgVpn: "my-vpn", clientName: "client-1" } },
        "server",
      );
      expect(issues).toHaveLength(0);
      expect(bindings.solace.msgVpn).toBe("my-vpn");
    });

    it("normalizes and auto-injects bindingVersion for anypointmq", () => {
      const { issues, bindings } = processBindings(
        { anypointmq: { destination: "queue-1" } },
        "channel",
      );
      expect(issues).toHaveLength(0);
      expect(bindings.anypointmq).toBeDefined();
      expect(bindings.anypointmq.bindingVersion).toBe("0.0.1");
    });

    it("normalizes and auto-injects bindingVersion for ros2", () => {
      const { issues, bindings } = processBindings({ ros2: { topic: "cmd_vel" } }, "operation");
      expect(issues).toHaveLength(0);
      expect(bindings.ros2).toBeDefined();
      expect(bindings.ros2.bindingVersion).toBe("0.1.0");
    });

    it("catches invalid bindingVersion for solace", () => {
      const { issues } = processBindings({ solace: { bindingVersion: "99.0.0" } }, "operation");
      const versionIssue = issues.find((i) => i.code === "invalid-binding-version");
      expect(versionIssue).toBeDefined();
      expect(versionIssue!.format.version).toBe("99.0.0");
    });

    it("warns on misplaced solace binding (channel not supported)", () => {
      const { issues } = processBindings({ solace: { priority: 5 } }, "channel");
      const misplaced = issues.find((i) => i.code === "misplaced-binding");
      expect(misplaced).toBeDefined();
      expect(misplaced!.format.protocol).toBe("solace");
    });

    it("does not reject binding-only protocols as unknown", () => {
      const { issues } = processBindings({ solace: {}, anypointmq: {}, ros2: {} }, "operation");
      const unknown = issues.filter((i) => i.code === "unknown-binding-protocol");
      expect(unknown).toHaveLength(0);
    });
  });
});
