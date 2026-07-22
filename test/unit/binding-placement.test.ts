/**
 * Binding Placement Validation Tests
 *
 * Tests the BINDING_PLACEMENT matrix, supportsBindingPlacement(),
 * getValidPlacements(), and the processBindings() target-kind validation.
 *
 * Based on @asyncapi/specs binding definitions.
 */

import { describe, it, expect } from "vitest";
import {
  supportsBindingPlacement,
  getValidPlacements,
} from "../../src/constants/binding-versions.js";
import { processBindings } from "../../src/validation/binding-validator.js";

// ============================================================================
// supportsBindingPlacement
// ============================================================================

describe("supportsBindingPlacement", () => {
  describe("Kafka", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("kafka", "channel")).toBe(true);
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("kafka", "operation")).toBe(true);
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("kafka", "message")).toBe(true);
    });
    it("does not support server bindings", () => {
      expect(supportsBindingPlacement("kafka", "server")).toBe(false);
    });
  });

  describe("WebSocket (ws)", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("ws", "channel")).toBe(true);
    });
    it("does not support operation bindings", () => {
      expect(supportsBindingPlacement("ws", "operation")).toBe(false);
    });
    it("does not support message bindings", () => {
      expect(supportsBindingPlacement("ws", "message")).toBe(false);
    });
  });

  describe("HTTP", () => {
    it("does not support channel bindings", () => {
      expect(supportsBindingPlacement("http", "channel")).toBe(false);
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("http", "operation")).toBe(true);
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("http", "message")).toBe(true);
    });
  });

  describe("MQTT", () => {
    it("does not support channel bindings", () => {
      expect(supportsBindingPlacement("mqtt", "channel")).toBe(false);
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("mqtt", "operation")).toBe(true);
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("mqtt", "message")).toBe(true);
    });
    it("supports server bindings", () => {
      expect(supportsBindingPlacement("mqtt", "server")).toBe(true);
    });
  });

  describe("AMQP", () => {
    it("supports channel bindings", () => {
      expect(supportsBindingPlacement("amqp", "channel")).toBe(true);
    });
    it("supports operation bindings", () => {
      expect(supportsBindingPlacement("amqp", "operation")).toBe(true);
    });
    it("supports message bindings", () => {
      expect(supportsBindingPlacement("amqp", "message")).toBe(true);
    });
    it("does not support server bindings", () => {
      expect(supportsBindingPlacement("amqp", "server")).toBe(false);
    });
  });

  it("returns false for unknown protocols", () => {
    expect(supportsBindingPlacement("unknown", "channel")).toBe(false);
    expect(supportsBindingPlacement("unknown", "operation")).toBe(false);
  });
});

// ============================================================================
// getValidPlacements
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
    expect(placements).toEqual(["channel"]);
  });

  it("returns message, operation, and server for MQTT", () => {
    const placements = getValidPlacements("mqtt");
    expect(placements).toContain("operation");
    expect(placements).toContain("message");
    expect(placements).toContain("server");
    expect(placements).not.toContain("channel");
  });

  it("returns empty array for unknown protocols", () => {
    expect(getValidPlacements("unknown")).toEqual([]);
  });
});

// ============================================================================
// processBindings with targetKind
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
        ws: { bindingVersion: "0.1.0" },
        kafka: { bindingVersion: "0.5.0" },
      },
      "operation",
    );
    const misplaced = issues.filter((i) => i.code === "misplaced-binding");
    expect(misplaced).toHaveLength(1);
    expect(misplaced[0].format.protocol).toBe("ws");
  });
});
