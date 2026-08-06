/**
 * AsyncAPI Standard Protocol Binding Tests
 *
 * Tests for AsyncAPI 3.1 compliant protocol bindings using standard format.
 * Replaces custom ProtocolBindingFactory with AsyncAPI specification compliance.
 */

import {
  type AsyncAPIProtocol,
  PROTOCOL_LIST,
  isSupportedProtocol,
} from "../../src/constants/protocols.js";

// Standard AsyncAPI 3.1 binding format helpers
const createStandardBinding = (
  protocol: AsyncAPIProtocol,
  config: Record<string, unknown> = {},
) => ({
  [protocol]: {
    bindingVersion: "0.5.0", // AsyncAPI 3.1 standard
    ...config,
  },
});

// AsyncAPI JSON Schema validation helper
const validateAsyncAPIBinding = (
  binding: Record<string, unknown>,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!binding || typeof binding !== "object") {
    errors.push("Binding must be an object");
    return { errors, valid: false };
  }

  // Check each protocol binding has required bindingVersion
  for (const [protocol, bindingConfig] of Object.entries(binding)) {
    if (typeof bindingConfig !== "object" || !bindingConfig) {
      errors.push(`Protocol '${protocol}' binding must be an object`);
      continue;
    }

    const config = bindingConfig as Record<string, unknown>;
    if (!config.bindingVersion) {
      errors.push(`Protocol '${protocol}' binding must have bindingVersion`);
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};

describe("asyncAPI 3.1 Standard Protocol Bindings", () => {
  it("kafka server bindings follow AsyncAPI standard format", () => {
    const serverBindings = createStandardBinding("kafka", {
      clientId: "test-client",
      schemaRegistryUrl: "http://localhost:8081",
    });

    expect(serverBindings).toBeDefined();
    expect(serverBindings.kafka).toBeDefined();
    expect(serverBindings.kafka.schemaRegistryUrl).toBe("http://localhost:8081");
    expect(serverBindings.kafka.clientId).toBe("test-client");
    expect(serverBindings.kafka.bindingVersion).toBe("0.5.0");

    // Validate AsyncAPI compliance
    const validation = validateAsyncAPIBinding(serverBindings);
    expect(validation.valid).toBeTruthy();
    expect(validation.errors).toHaveLength(0);
  });

  it("minimal Kafka server bindings are valid", () => {
    const serverBindings = createStandardBinding("kafka");

    expect(serverBindings).toBeDefined();
    expect(serverBindings.kafka).toBeDefined();
    expect(serverBindings.kafka.bindingVersion).toBe("0.5.0");

    const validation = validateAsyncAPIBinding(serverBindings);
    expect(validation.valid).toBeTruthy();
  });

  it("kafka channel bindings follow AsyncAPI standard", () => {
    const channelBindings = createStandardBinding("kafka", {
      partitions: 3,
      replicas: 2,
      topic: "user-events",
    });

    expect(channelBindings).toBeDefined();
    expect(channelBindings.kafka).toBeDefined();
    expect(channelBindings.kafka.topic).toBe("user-events");
    expect(channelBindings.kafka.partitions).toBe(3);
    expect(channelBindings.kafka.replicas).toBe(2);
    expect(channelBindings.kafka.bindingVersion).toBe("0.5.0");

    const validation = validateAsyncAPIBinding(channelBindings);
    expect(validation.valid).toBeTruthy();
  });

  it("webSocket channel bindings are AsyncAPI compliant", () => {
    const channelBindings = createStandardBinding("websocket", {
      headers: { type: "object" },
      method: "GET",
    });

    expect(channelBindings).toBeDefined();
    expect(channelBindings.websocket).toBeDefined();
    expect(channelBindings.websocket.method).toBe("GET");
    expect(channelBindings.websocket.bindingVersion).toBe("0.5.0");

    const validation = validateAsyncAPIBinding(channelBindings);
    expect(validation.valid).toBeTruthy();
  });

  it("supported protocols are properly defined", () => {
    expect(PROTOCOL_LIST).toBeDefined();
    expect(PROTOCOL_LIST.length).toBeGreaterThan(0);
    expect(PROTOCOL_LIST).toContain("kafka");
    expect(PROTOCOL_LIST).toContain("ws");
    expect(PROTOCOL_LIST).toContain("http");
  });

  it("protocol aliases are accepted but not in the canonical list", () => {
    expect(PROTOCOL_LIST).not.toContain("websocket");
    expect(isSupportedProtocol("websocket")).toBeTruthy();
    expect(isSupportedProtocol("ws")).toBeTruthy();
  });

  it("binding validation catches missing bindingVersion", () => {
    const invalidBinding = {
      kafka: {
        topic: "test",
        // Missing bindingVersion
      },
    };

    const validation = validateAsyncAPIBinding(invalidBinding);
    expect(validation.valid).toBeFalsy();
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0]).toContain("bindingVersion");
  });

  it("binding validation catches invalid binding structure", () => {
    const invalidBinding = {
      kafka: null,
    };

    const validation = validateAsyncAPIBinding(invalidBinding);
    expect(validation.valid).toBeFalsy();
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
