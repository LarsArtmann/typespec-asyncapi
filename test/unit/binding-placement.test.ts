/**
 * Binding Placement Validation Tests
 *
 * Tests the BINDING_PLACEMENT matrix, supportsBindingPlacement(),
 * getValidPlacements(), and the processBindings() target-kind validation.
 *
 * Based on @asyncapi/specs binding definitions.
 */

import {
  getValidPlacements,
  supportsBindingPlacement,
} from "../../src/constants/binding-versions.js";
import { processBindings } from "../../src/validation/binding-validator.js";

// ============================================================================
// SupportsBindingPlacement
// ============================================================================

describe("supportsBindingPlacement", () => {
  describe("kafka", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("kafka", "channel")).toBeTruthy();
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("kafka", "operation")).toBeTruthy();
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("kafka", "message")).toBeTruthy();
    });
    it("does not support server bindings", () => {
      expect(supportsBindingPlacement("kafka", "server")).toBeFalsy();
    });
  });

  describe("webSocket (ws)", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("ws", "channel")).toBeTruthy();
    });
    it("does not support operation bindings", () => {
      expect(supportsBindingPlacement("ws", "operation")).toBeFalsy();
    });
    it("does not support message bindings", () => {
      expect(supportsBindingPlacement("ws", "message")).toBeFalsy();
    });
  });

  describe("hTTP", () => {
    it("does not support channel bindings", () => {
      expect(supportsBindingPlacement("http", "channel")).toBeFalsy();
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("http", "operation")).toBeTruthy();
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("http", "message")).toBeTruthy();
    });
  });

  describe("mQTT", () => {
    it("does not support channel bindings", () => {
      expect(supportsBindingPlacement("mqtt", "channel")).toBeFalsy();
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("mqtt", "operation")).toBeTruthy();
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("mqtt", "message")).toBeTruthy();
    });
    it("supports server bindings", () => {
      expect(supportsBindingPlacement("mqtt", "server")).toBeTruthy();
    });
  });

  describe("aMQP", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("amqp", "channel")).toBeTruthy();
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("amqp", "operation")).toBeTruthy();
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("amqp", "message")).toBeTruthy();
    });
    it("does not support server bindings", () => {
      expect(supportsBindingPlacement("amqp", "server")).toBeFalsy();
    });
  });

  it("returns false for unknown protocols", () => {
    expect(supportsBindingPlacement("unknown", "channel")).toBeFalsy();
    expect(supportsBindingPlacement("unknown", "operation")).toBeFalsy();
  });
});

// ============================================================================
// GetValidPlacements
// ============================================================================

describe("getValidPlacements", () => {
  it("returns all valid placements for Kafka", () => {
    const placements = getValidPlacements("kafka");
    expect(placements).toContain("channel");
    expect(placements).toContain("operation");
    expect(placements).toContain("message");
    expect(placements).not.toContain("server");
  });

  it("returns only channel for WebSocket", () => {
    const placements = getValidPlacements("ws");
    expect(placements).toStrictEqual(["channel"]);
  });

  it("returns message, operation, and server for MQTT", () => {
    const placements = getValidPlacements("mqtt");
    expect(placements).toContain("operation");
    expect(placements).toContain("message");
    expect(placements).toContain("server");
    expect(placements).not.toContain("channel");
  });

  it("returns empty array for unknown protocols", () => {
    expect(getValidPlacements("unknown")).toStrictEqual([]);
  });
});

// ============================================================================
// ProcessBindings with targetKind
// ============================================================================

describe("processBindings placement validation", () => {
  it("emits misplaced-binding when ws is placed on an operation", () => {
    const { issues } = processBindings({ ws: { bindingVersion: "0.1.0" } }, "operation");
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(1);
    expect(misplaced[0].format.protocol).toBe("ws");
    expect(misplaced[0].format.targetKind).toBe("operation");
    expect(misplaced[0].format.validPlacements).toBe("channel");
  });

  it("emits misplaced-binding when ws is placed on a message", () => {
    const { issues } = processBindings({ ws: { bindingVersion: "0.1.0" } }, "message");
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(1);
  });

  it("does NOT emit misplaced-binding when kafka is placed on an operation", () => {
    const { issues } = processBindings({ kafka: { bindingVersion: "0.5.0" } }, "operation");
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("does NOT emit misplaced-binding when kafka is placed on a message", () => {
    const { issues } = processBindings({ kafka: { bindingVersion: "0.5.0" } }, "message");
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("does NOT emit misplaced-binding when mqtt is placed on an operation", () => {
    const { issues } = processBindings({ mqtt: { bindingVersion: "0.2.0" } }, "operation");
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("does NOT emit placement issues when targetKind is omitted (backward compat)", () => {
    const { issues } = processBindings({
      ws: { bindingVersion: "0.1.0" },
    });
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("still passes through the binding even when misplaced", () => {
    const { bindings } = processBindings({ ws: { bindingVersion: "0.1.0" } }, "operation");
    expect(bindings.ws).toBeDefined();
    expect(bindings.ws.bindingVersion).toBe("0.1.0");
  });

  it("emits misplaced-binding for multiple misplaced protocols", () => {
    const { issues } = processBindings(
      {
        kafka: { bindingVersion: "0.5.0" },
        ws: { bindingVersion: "0.1.0" },
      },
      "operation",
    );
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(1);
    expect(misplaced[0].format.protocol).toBe("ws");
  });
});
