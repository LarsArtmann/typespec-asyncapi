/**
 * BDD Tests — User-Focused AsyncAPI Emitter Behaviors
 *
 * Tests written from the END USER's perspective:
 * "As a user defining TypeSpec, when I use @decorator, I get X in my AsyncAPI output"
 *
 * These tests exercise the full pipeline: TypeSpec source → compiler → emitter → AsyncAPI document.
 * They verify observable behavior, not implementation details.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { PROTOCOL_LIST, isSupportedProtocol } from "../../src/constants/protocols.js";
import {
  normalizePathTemplate,
  parsePathTemplate,
  pathToChannelName,
  validatePathTemplate,
} from "../utils/path-templates.js";

// ============================================================================
// Feature: Channel Definition
// ============================================================================
describe("bdd: user defines a channel with @channel decorator", () => {
  it("given a valid channel path, When parsed, Then parameters are extracted correctly", () => {
    const template = parsePathTemplate("/users/{userId}/events");
    expect(template.path).toBe("/users/{userId}/events");
    expect(template.parameters).toHaveLength(1);
    expect(template.parameters[0]!.name).toBe("userId");
    expect(template.parameters[0]!.required).toBeTruthy();
  });

  it("given a channel path without parameters, When parsed, Then no parameters exist", () => {
    const template = parsePathTemplate("/user-events");
    expect(template.path).toBe("/user-events");
    expect(template.parameters).toHaveLength(0);
  });

  it("given an invalid channel path (no leading /), When validated, Then it fails", () => {
    expect(validatePathTemplate("no-slash")).toBeFalsy();
  });

  it("given a valid channel path, When validated, Then it passes", () => {
    expect(validatePathTemplate("/users/events")).toBeTruthy();
  });

  it("given a channel path with unbalanced braces, When validated, Then it fails", () => {
    expect(validatePathTemplate("/users/{userId/events")).toBeFalsy();
  });

  it("given a channel path, When converted to channel name, Then segments are joined", () => {
    expect(pathToChannelName("/users/events")).toBe("users-events");
  });

  it("given a TypeSpec model with @channel, When compiled, Then the output contains the channel", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.channels).toBeDefined();
    expect(Object.keys(doc.channels!)).toHaveLength(1);
  });
});

// ============================================================================
// Feature: Protocol Binding Configuration
// ============================================================================
describe("bdd: user configures protocol bindings", () => {
  it("given all supported protocols, When checked, Then they include kafka, http, ws, mqtt", () => {
    expect(isSupportedProtocol("kafka")).toBeTruthy();
    expect(isSupportedProtocol("http")).toBeTruthy();
    expect(isSupportedProtocol("ws")).toBeTruthy();
    expect(isSupportedProtocol("mqtt")).toBeTruthy();
  });

  it("given an unsupported protocol, When checked, Then it returns false", () => {
    expect(isSupportedProtocol("unknown-protocol")).toBeFalsy();
  });

  it("given all supported protocols list, When counted, Then there are 19 canonical protocols", () => {
    expect(PROTOCOL_LIST).toHaveLength(19);
  });

  it("given a TypeSpec with @protocol, When compiled, Then channel bindings are present", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "kafka",
        topic: "test-topic",
      })
      op publish(): Event;
    `);
    const channel = Object.values(doc.channels!)[0]!;
    expect(channel.bindings).toBeDefined();
    expect(channel.bindings!.kafka).toBeDefined();
    expect(channel.bindings!.kafka!.bindingVersion).toBe("0.5.0");
  });
});

// ============================================================================
// Feature: Path Template Utilities
// ============================================================================
describe("bdd: user defines path templates for channels", () => {
  it("given a path with multiple parameters, When parsed, Then all parameters are extracted", () => {
    const template = parsePathTemplate("/orgs/{orgId}/users/{userId}/events");
    expect(template.parameters).toHaveLength(2);
    expect(template.parameters[0]!.name).toBe("orgId");
    expect(template.parameters[1]!.name).toBe("userId");
  });

  it("given a path with typed parameter, When parsed, Then type is extracted", () => {
    const template = parsePathTemplate("/users/{userId:string}");
    expect(template.parameters).toHaveLength(1);
    expect(template.parameters[0]!.name).toBe("userId");
    expect(template.parameters[0]!.type).toBe("string");
  });

  it("given a path with trailing slash, When normalized, Then slash is removed", () => {
    expect(normalizePathTemplate("/users/events/")).toBe("/users/events");
  });

  it("given root path, When normalized, Then slash is preserved", () => {
    expect(normalizePathTemplate("/")).toBe("/");
  });

  it("given a path without leading slash, When normalized, Then slash is added", () => {
    expect(normalizePathTemplate("users/events")).toBe("/users/events");
  });
});

// ============================================================================
// Feature: Security Scheme Integration
// ============================================================================
describe("bdd: user defines security schemes", () => {
  it("given a TypeSpec with @security, When compiled, Then securitySchemes are present", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "api-key", scheme: #{ type: "httpApiKey", in: "header", name: "X-API-Key" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.components).toBeDefined();
    expect(doc.components!.securitySchemes).toBeDefined();
    const scheme = doc.components!.securitySchemes!["api-key"];
    expect(scheme).toBeDefined();
    expect(scheme.type).toBe("httpApiKey");
  });
});

// ============================================================================
// Feature: Server Configuration
// ============================================================================
describe("bdd: user defines servers", () => {
  it("given a TypeSpec with @server, When compiled, Then servers are present", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt",
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.servers).toBeDefined();
    expect(doc.servers!.broker).toBeDefined();
    expect(doc.servers!.broker.protocol).toBe("mqtt");
  });
});

// ============================================================================
// Feature: Message Configuration
// ============================================================================
describe("bdd: user defines messages", () => {
  it("given a TypeSpec with @message, When compiled, Then message metadata is present", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @message(#{
        title: "User Event",
        description: "A user-related event",
        contentType: "application/json",
      })
      model UserEvent { id: string; }
      @channel("users")
      op publish(): UserEvent;
    `);
    expect(doc.components).toBeDefined();
    expect(doc.components!.messages).toBeDefined();
    const messages = Object.values(doc.components!.messages!);
    expect(messages).toHaveLength(1);
  });
});

// ============================================================================
// Feature: Invalid Configuration Validation
// ============================================================================
describe("bdd: user provides invalid configuration", () => {
  it("given a TypeSpec with invalid bindings, When compiled, Then diagnostics are reported", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @bindings(#{
        "unknown-protocol": #{ bindingVersion: "1.0.0" },
      })
      op publish(): Event;
    `);
    const warnings = result.diagnostics.filter((d) => d.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((d) => d.code.includes("unknown-binding-protocol"))).toBe(true);
  });
});

// ============================================================================
// Feature: Document Structure Compliance
// ============================================================================
describe("bdd: emitter produces valid AsyncAPI 3.1.0 documents", () => {
  it("given a minimal TypeSpec, When compiled, Then asyncapi version is 3.1.0", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.info).toBeDefined();
    expect(doc.info.version).toBeDefined();
  });

  it("given a TypeSpec with schemas, When compiled, Then components.schemas are populated", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model UserEvent { id: string; type: string; timestamp: utcDateTime; }
      @channel("events")
      op publish(): UserEvent;
    `);
    expect(doc.components).toBeDefined();
    expect(doc.components!.schemas).toBeDefined();
    expect(doc.components!.schemas!.UserEvent).toBeDefined();
  });
});

// ============================================================================
// Feature: Namespace Bindings (Server-level)
// ============================================================================
describe("bdd: user applies @bindings on Namespace for server bindings", () => {
  it("given a namespace with @bindings, When compiled, Then server bindings are present", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt",
      })
      @bindings(#{
        mqtt: #{ clientId: "my-client", cleanSession: true },
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.servers!.broker.bindings).toBeDefined();
    expect(doc.servers!.broker.bindings!.mqtt).toBeDefined();
    expect(doc.servers!.broker.bindings!.mqtt!.clientId).toBe("my-client");
  });
});
