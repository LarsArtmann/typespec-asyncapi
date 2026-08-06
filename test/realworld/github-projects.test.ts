/**
 * GitHub Real-Project Compilation Tests
 *
 * Tests the AsyncAPI emitter against model definitions VERBATIM from real
 * GitHub repositories — not recreated patterns, but the actual .tsp source
 * from production codebases, adapted only to strip HTTP/OpenAPI/Azure-specific
 * decorators incompatible with AsyncAPI.
 *
 * Source repos (cloned from GitHub):
 *   bterlson/typespec-todo:       TypeSpec creator's todo app. Tests bytes,
 *                                 @visibility("none"), model property refs
 *                                 (User.id), mixed unions, @pattern, spread
 *   DanSnow/typespec-events:      Event tracking. Tests int64 timestamps,
 *                                 nested models, arrays of named models
 *   livesession/xyd:              Production API toolchain. Tests enums with
 *                                 explicit string values, spread, float64,
 *                                 many optional fields, cross-references
 *   Azure/azure-rest-api-specs:   Enterprise Azure EventGrid. Tests unknown
 *                                 type, bytes, union with named variants,
 *                                 array-of-named-model, recursive ErrorModel
 *   milehimikey/typespec-asyncapi: Competing AsyncAPI emitter's example.
 *                                 Tests @header, @correlationId, @message,
 *                                 float32, Kafka protocol
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

const githubFixturesDir = join(import.meta.dirname, "fixtures", "github");

interface GithubFixture {
  name: string;
  source: string;
  repo: string;
}

function loadGithubFixtures(): GithubFixture[] {
  return readdirSync(githubFixturesDir)
    .filter((f) => f.endsWith(".tsp"))
    .map((f) => ({
      name: f.replace(/\.tsp$/, ""),
      source: readFileSync(join(githubFixturesDir, f), "utf8"),
      repo: f,
    }));
}

const fixtures = loadGithubFixtures();

describe("github real-project compilation", () => {
  it("should have at least 5 fixtures from real GitHub repos", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(5);
  });

  for (const fixture of fixtures) {
    describe(`repo: ${fixture.name}`, () => {
      let doc: ParsedAsyncAPIDocument;

      it("should compile and validate against AsyncAPI 3.1.0 JSON Schema", async () => {
        doc = await compileAndValidateOrThrow(fixture.source);
        expect(doc.asyncapi).toBe("3.1.0");
      });

      it("should compile without error diagnostics", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toStrictEqual([]);
      });

      it("should have operations, channels, and schemas", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const d = result.asyncApiDoc;
        expect(Object.keys(d?.operations ?? {}).length).toBeGreaterThanOrEqual(2);
        expect(Object.keys(d?.channels ?? {}).length).toBeGreaterThanOrEqual(1);
        expect(Object.keys(d?.components?.schemas ?? {}).length).toBeGreaterThanOrEqual(3);
      });

      it("should produce valid $ref chains", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const d = result.asyncApiDoc;
        const opRefs: string[] = [];
        for (const [, op] of Object.entries(d?.operations ?? {})) {
          opRefs.push(op.channel?.$ref ?? "");
        }
        for (const ref of opRefs) {
          expect(ref).toMatch(/^#\/channels\//);
        }
        const channelMsgRefs: string[] = [];
        for (const [, ch] of Object.entries(d?.channels ?? {})) {
          for (const [, msgRef] of Object.entries(ch.messages ?? {})) {
            channelMsgRefs.push(msgRef.$ref ?? "");
          }
        }
        for (const ref of channelMsgRefs) {
          expect(ref).toMatch(/^#\/components\/messages\//);
        }
      });
    });
  }

  describe("bterlson-typespec-todo patterns", () => {
    const source = readFileSync(
      join(githubFixturesDir, "bterlson-typespec-todo.tsp"),
      "utf8",
    );

    it("should render bytes type as { type: string, format: byte }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const fileAttachment = doc.components?.schemas?.TodoFileAttachment;
      expect(fileAttachment?.properties?.contents).toStrictEqual({
        format: "byte",
        type: "string",
      });
    });

    it("should render model property ref (User.id) as safeint", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const todoItem = doc.components?.schemas?.TodoItem;
      expect(todoItem?.properties?.createdBy).toStrictEqual({
        format: "safeint",
        type: "integer",
      });
    });

    it("should render string literal union for status", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const todoItem = doc.components?.schemas?.TodoItem;
      expect(todoItem?.properties?.status).toMatchObject({
        type: "string",
        enum: ["NotStarted", "InProgress", "Completed"],
      });
    });

    it("should render @pattern regex on color field", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const label = doc.components?.schemas?.TodoLabelRecord;
      expect(label?.properties?.color?.pattern).toBe(
        "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
      );
    });

    it("should render @minLength/@maxLength on username", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const user = doc.components?.schemas?.User;
      expect(user?.properties?.username).toMatchObject({
        type: "string",
        minLength: 2,
        maxLength: 50,
      });
    });

    it("should render default values from = syntax", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const pagination = doc.components?.schemas?.PaginationControls;
      expect(pagination?.properties?.limit?.default).toBe(50);
      expect(pagination?.properties?.offset?.default).toBe(0);
    });

    it("should render union TodoLabels as anyOf", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const labels = doc.components?.schemas?.TodoLabels;
      expect(labels?.anyOf).toBeDefined();
      expect(labels?.anyOf?.length).toBeGreaterThanOrEqual(2);
    });

    it("should render inheritance via allOf for Standard4XXResponse extends ApiError", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const resp = doc.components?.schemas?.Standard4XXResponse;
      expect(resp?.allOf).toBeDefined();
      expect(resp?.allOf?.[0]?.$ref).toBe("#/components/schemas/ApiError");
    });

    it("should render utcDateTime as { type: string, format: date-time }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const todoItem = doc.components?.schemas?.TodoItem;
      expect(todoItem?.properties?.createdAt).toStrictEqual({
        format: "date-time",
        type: "string",
      });
    });
  });

  describe("dansnow-typespec-events patterns", () => {
    const source = readFileSync(
      join(githubFixturesDir, "dansnow-typespec-events.tsp"),
      "utf8",
    );

    it("should render int64 timestamp as { type: integer, format: int64 }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const event = doc.components?.schemas?.UserSignedUpEvent;
      expect(event?.properties?.timestamp).toStrictEqual({
        format: "int64",
        type: "integer",
      });
    });

    it("should render nested Address model via $ref", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const event = doc.components?.schemas?.UserAddressUpdatedEvent;
      expect(event?.properties?.newAddress).toStrictEqual({
        $ref: "#/components/schemas/Address",
      });
    });

    it("should render CartItem[] as array with $ref items", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const cart = doc.components?.schemas?.CartItemsAdded;
      expect(cart?.properties?.items).toStrictEqual({
        type: "array",
        items: { $ref: "#/components/schemas/CartItem" },
      });
    });

    it("should mark optional userId with correct required array", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const event = doc.components?.schemas?.ProductViewedEvent;
      expect(event?.required).not.toContain("userId");
      expect(event?.required).toContain("productId");
    });
  });

  describe("livesession-xyd patterns", () => {
    const source = readFileSync(
      join(githubFixturesDir, "livesession-xyd.tsp"),
      "utf8",
    );

    it("should render enum with explicit string values (UsageRange)", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const range = doc.components?.schemas?.UsageRange;
      expect(range).toMatchObject({
        type: "string",
        enum: ["24h", "7d", "30d", "90d"],
      });
    });

    it("should render enum without explicit values (BuildStatus)", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const status = doc.components?.schemas?.BuildStatus;
      expect(status).toMatchObject({
        type: "string",
        enum: ["ready", "building", "error", "draft"],
      });
    });

    it("should flatten spread (...RegistryEntryCore) properties into RegistryEntry", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const entry = doc.components?.schemas?.RegistryEntry;
      expect(entry?.properties?.id).toBeDefined();
      expect(entry?.properties?.name).toBeDefined();
      expect(entry?.properties?.description).toBeDefined();
      expect(entry?.properties?.format).toBeDefined();
      expect(entry?.properties?.sdkTargetCount).toStrictEqual({
        format: "int32",
        type: "integer",
      });
    });

    it("should render float64 as { type: number, format: double }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const point = doc.components?.schemas?.UsagePoint;
      expect(point?.properties?.value).toStrictEqual({
        format: "double",
        type: "number",
      });
    });

    it("should render arrays of named models (ApiVersion[])", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const entry = doc.components?.schemas?.RegistryEntryCore;
      expect(entry?.properties?.versions).toStrictEqual({
        type: "array",
        items: { $ref: "#/components/schemas/ApiVersion" },
      });
    });

    it("should handle many optional fields on RepoConnection", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const conn = doc.components?.schemas?.RepoConnection;
      expect(conn?.required).toContain("id");
      expect(conn?.required).toContain("providerId");
      expect(conn?.required).not.toContain("lastSyncedAt");
      expect(conn?.required).not.toContain("releaseMode");
    });
  });

  describe("azure-eventgrid patterns", () => {
    const source = readFileSync(
      join(githubFixturesDir, "azure-eventgrid.tsp"),
      "utf8",
    );

    it("should render unknown type as empty schema or type: object", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const cloudEvent = doc.components?.schemas?.CloudEvent;
      const dataSchema = cloudEvent?.properties?.data;
      expect(dataSchema).toBeDefined();
    });

    it("should render bytes (data_base64) as { type: string, format: byte }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const cloudEvent = doc.components?.schemas?.CloudEvent;
      expect(cloudEvent?.properties?.data_base64).toStrictEqual({
        format: "byte",
        type: "string",
      });
    });

    it("should render CloudEvent with optional unknown data field", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const cloudEvent = doc.components?.schemas?.CloudEvent;
      expect(cloudEvent?.properties?.data).toBeDefined();
      expect(cloudEvent?.required).not.toContain("data");
    });

    it("should render nested BrokerProperties via $ref in ReceiveDetails", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const details = doc.components?.schemas?.ReceiveDetails;
      expect(details?.properties?.brokerProperties).toStrictEqual({
        $ref: "#/components/schemas/BrokerProperties",
      });
    });

    it("should render array of named models (ReceiveDetails[])", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const result = doc.components?.schemas?.ReceiveResult;
      expect(result?.properties?.value).toStrictEqual({
        type: "array",
        items: { $ref: "#/components/schemas/ReceiveDetails" },
      });
    });

    it("should render recursive ErrorModel (details?: ErrorModel[])", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const error = doc.components?.schemas?.ErrorModel;
      expect(error?.properties?.details).toBeDefined();
    });
  });

  describe("milehimikey-kafka-orders patterns", () => {
    const source = readFileSync(
      join(githubFixturesDir, "milehimikey-kafka-orders.tsp"),
      "utf8",
    );

    it("should render float32 unitPrice as { type: number, format: float }", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const item = doc.components?.schemas?.OrderItem;
      expect(item?.properties?.unitPrice).toStrictEqual({
        format: "float",
        type: "number",
      });
    });

    it("should render OrderStatus enum", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const status = doc.components?.schemas?.OrderStatus;
      expect(status).toMatchObject({
        type: "string",
        enum: ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      });
    });

    it("should render nested ShippingAddress via $ref", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const order = doc.components?.schemas?.OrderPlaced;
      expect(order?.properties?.shippingAddress).toStrictEqual({
        $ref: "#/components/schemas/ShippingAddress",
      });
    });

    it("should render OrderItem[] as array with $ref items", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const order = doc.components?.schemas?.OrderPlaced;
      expect(order?.properties?.items).toStrictEqual({
        type: "array",
        items: { $ref: "#/components/schemas/OrderItem" },
      });
    });

    it("should have bidirectional operations on same channel (orders.lifecycle)", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const ops = Object.entries(doc.operations ?? {});
      const lifecycleOps = ops.filter(([, op]) =>
        op.channel?.$ref?.includes("orders.lifecycle"),
      );
      expect(lifecycleOps.length).toBeGreaterThanOrEqual(2);
    });

    it("should have parameterized channel address (orders.{orderId})", async () => {
      const doc = await compileAndValidateOrThrow(source);
      const channels = Object.entries(doc.channels ?? {});
      const paramChannels = channels.filter(([, ch]) =>
        ch.address?.includes("{orderId}"),
      );
      expect(paramChannels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
