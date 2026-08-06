/**
 * Canonical AsyncAPI Spec Ports — Structural Validation
 *
 * Tests well-known real-world AsyncAPI API patterns (Streetlights, Chat,
 * Sensor IoT, Notifications) ported to TypeSpec, validating not just schema
 * compliance but also structural correctness specific to each domain.
 *
 * These specs are based on the canonical AsyncAPI examples that the AsyncAPI
 * community uses as reference implementations — Streetlights (MQTT pub/sub),
 * Gitter-style WebSocket chat, multi-protocol IoT telemetry, and enterprise
 * notification delivery.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { compileAndValidate } from "../utils/schema-validator.js";

const fixturesDir = join(import.meta.dirname, "fixtures");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, `${name}.tsp`), "utf8");
}

function fixtureExists(name: string): boolean {
  try {
    return statSync(join(fixturesDir, `${name}.tsp`)).isFile();
  } catch {
    return false;
  }
}

const canonicalSpecs = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".tsp"))
  .map((f) => f.replace(/\.tsp$/, ""))
  .filter(
    (name) =>
      name.startsWith("streetlights") ||
      name.startsWith("chat") ||
      name.startsWith("sensor") ||
      name.startsWith("notifications"),
  );

describe("canonical AsyncAPI Spec Ports", () => {
  it("should find all canonical spec fixtures", () => {
    expect(fixtureExists("streetlights-mqtt")).toBe(true);
    expect(fixtureExists("chat-websocket")).toBe(true);
    expect(fixtureExists("sensor-iot-multi-protocol")).toBe(true);
    expect(fixtureExists("notifications-enterprise")).toBe(true);
  });

  // --- Generic validation for all canonical specs ---
  for (const specName of canonicalSpecs) {
    describe(`spec: ${specName}`, () => {
      it("should compile and validate against AsyncAPI 3.1.0", async () => {
        const validation = await compileAndValidate(loadFixture(specName));
        const schemaErrors = validation.errors
          ? validation.errors.map((e) => `${e.instancePath}: ${e.message}`)
          : [];
        const diagErrors = validation.diagnostics
          .filter((d) => d.severity === "error")
          .map((d) => `[${d.code}] ${d.message}`);
        expect({
          valid: validation.valid,
          schemaErrors,
          diagErrors,
        }).toStrictEqual({
          valid: true,
          schemaErrors: [],
          diagErrors: [],
        });
      });

      it("should have multiple servers (multi-protocol)", async () => {
        const result = await compileAsyncAPI(loadFixture(specName));
        const servers = result.asyncApiDoc?.servers ?? {};
        expect(Object.keys(servers).length).toBeGreaterThanOrEqual(1);
        for (const [, server] of Object.entries(servers)) {
          expect(server.host).toBeDefined();
          expect(server.protocol).toBeDefined();
        }
      });

      it("should have bidirectional operations (publish + subscribe)", async () => {
        const result = await compileAsyncAPI(loadFixture(specName));
        const ops = result.asyncApiDoc?.operations ?? {};
        const actions = new Set(Object.values(ops).map((op) => op.action));
        expect({
          hasPublish: actions.has("send"),
          hasSubscribe: actions.has("receive"),
        }).toStrictEqual({
          hasPublish: true,
          hasSubscribe: true,
        });
      });
    });
  }

  // --- Streetlights-specific assertions ---
  describe("streetlights-mqtt: detailed structure", () => {
    it("should use MQTT protocol on servers", async () => {
      const result = await compileAsyncAPI(loadFixture("streetlights-mqtt"));
      const servers = result.asyncApiDoc?.servers ?? {};
      const protocols = Object.values(servers).map((s) => s.protocol);
      expect(protocols.every((p) => p === "mqtt")).toBeTruthy();
    });

    it("should have parameterized channel addresses with {streetlightId}", async () => {
      const result = await compileAsyncAPI(loadFixture("streetlights-mqtt"));
      const channels = result.asyncApiDoc?.channels ?? {};
      const addresses = Object.values(channels).map((c) => c.address);
      const hasParamChannel = addresses.some((a) =>
        a.includes("{streetlightId}"),
      );
      expect(hasParamChannel).toBeTruthy();
    });

    it("should emit enum for LightMeasurementUnit", async () => {
      const result = await compileAsyncAPI(loadFixture("streetlights-mqtt"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      expect(schemas.LightMeasurementUnit?.enum).toStrictEqual([
        "lux",
        "watt",
        "lumen",
      ]);
    });

    it("should emit @minValue/@maxValue constraints on DimLightRequest", async () => {
      const result = await compileAsyncAPI(loadFixture("streetlights-mqtt"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const pwmProp = schemas.DimLightRequest?.properties?.pwmDutyCycle;
      expect(pwmProp?.minimum).toBe(0);
      expect(pwmProp?.maximum).toBe(100);
    });

    it("should emit @format date-time on sentAt", async () => {
      const result = await compileAsyncAPI(loadFixture("streetlights-mqtt"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const sentAt = schemas.LightMeasurement?.properties?.sentAt;
      expect(sentAt?.format).toBe("date-time");
    });
  });

  // --- Chat-specific assertions ---
  describe("chat-websocket: detailed structure", () => {
    it("should use WSS protocol", async () => {
      const result = await compileAsyncAPI(loadFixture("chat-websocket"));
      const servers = result.asyncApiDoc?.servers ?? {};
      const protocols = Object.values(servers).map((s) => s.protocol);
      expect(protocols).toContain("wss");
    });

    it("should emit default values for optional properties", async () => {
      const result = await compileAsyncAPI(loadFixture("chat-websocket"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      expect(schemas.ChatMessage?.properties?.edited?.default).toBeFalsy();
    });

    it("should produce $ref for nested named model arrays", async () => {
      const result = await compileAsyncAPI(loadFixture("chat-websocket"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const reactions = schemas.ChatMessage?.properties?.reactions;
      expect(reactions?.items?.$ref ?? "").toMatch(/^#\/components\/schemas\//);
      expect(reactions?.items?.$ref ?? "").toContain("MessageReaction");
    });

    it("should emit enum for user status field", async () => {
      const result = await compileAsyncAPI(loadFixture("chat-websocket"));
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const statusProp = schemas.User?.properties?.status;
      expect(statusProp?.enum).toStrictEqual([
        "online",
        "away",
        "busy",
        "offline",
      ]);
    });
  });

  // --- Sensor IoT-specific assertions ---
  describe("sensor-iot-multi-protocol: detailed structure", () => {
    it("should have 3 servers with different protocols", async () => {
      const result = await compileAsyncAPI(
        loadFixture("sensor-iot-multi-protocol"),
      );
      const servers = result.asyncApiDoc?.servers ?? {};
      const protocols = new Set(
        Object.values(servers).map((s) => s.protocol),
      );
      expect(protocols.size).toBeGreaterThanOrEqual(3);
      expect(protocols.has("kafka")).toBeTruthy();
      expect(protocols.has("mqtt")).toBeTruthy();
      expect(protocols.has("ws")).toBeTruthy();
    });

    it("should emit nested anonymous model for sensor location", async () => {
      const result = await compileAsyncAPI(
        loadFixture("sensor-iot-multi-protocol"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const location = schemas.Sensor?.properties?.location;
      expect(location?.type).toBe("object");
      expect(location?.properties?.latitude).toBeDefined();
      expect(location?.properties?.longitude).toBeDefined();
    });

    it("should emit array of named model for batch readings", async () => {
      const result = await compileAsyncAPI(
        loadFixture("sensor-iot-multi-protocol"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const readings = schemas.SensorBatch?.properties?.readings;
      expect(readings?.type).toBe("array");
      expect(readings?.items?.$ref).toContain("SensorReading");
    });

    it("should emit string literal union for quality field", async () => {
      const result = await compileAsyncAPI(
        loadFixture("sensor-iot-multi-protocol"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const quality = schemas.SensorReading?.properties?.quality;
      expect(quality?.enum).toStrictEqual(["good", "questionable", "bad"]);
    });
  });

  // --- Notifications-specific assertions ---
  describe("notifications-enterprise: detailed structure", () => {
    it("should have AMQP and HTTPS servers", async () => {
      const result = await compileAsyncAPI(
        loadFixture("notifications-enterprise"),
      );
      const servers = result.asyncApiDoc?.servers ?? {};
      const protocols = Object.values(servers).map((s) => s.protocol);
      expect(protocols).toContain("amqp");
      expect(protocols).toContain("https");
    });

    it("should emit default values for NotificationRequest", async () => {
      const result = await compileAsyncAPI(
        loadFixture("notifications-enterprise"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      expect(schemas.NotificationRequest?.properties?.priority?.default).toBe(
        "normal",
      );
    });

    it("should emit nested retryPolicy with default values", async () => {
      const result = await compileAsyncAPI(
        loadFixture("notifications-enterprise"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      const webhook = schemas.WebhookConfig;
      const retryPolicy = webhook?.properties?.retryPolicy;
      expect(retryPolicy?.type).toBe("object");
      expect(retryPolicy?.properties?.maxRetries?.default).toBe(5);
      expect(retryPolicy?.properties?.initialDelayMs?.default).toBe(1000);
    });

    it("should emit enum for DeliveryStatus", async () => {
      const result = await compileAsyncAPI(
        loadFixture("notifications-enterprise"),
      );
      const schemas = result.asyncApiDoc?.components?.schemas ?? {};
      expect(schemas.DeliveryStatus?.enum).toStrictEqual([
        "queued",
        "sent",
        "delivered",
        "failed",
        "bounced",
        "unsubscribed",
        "deferred",
        "cancelled",
      ]);
    });
  });
});
