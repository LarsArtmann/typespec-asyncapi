/**
 * Tests: Decorator Combinations & Edge Cases
 *
 * Covers patterns not fully tested elsewhere:
 * - @defaultContentType on namespace
 * - Multiple @server decorators with content verification
 * - Void operation (no return type) produces valid AsyncAPI
 * - Enum with explicit member values
 * - @channel with @doc combination
 * - @operationId and @messageId
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("decorator combinations and edge cases", () => {
  describe("@defaultContentType", () => {
    it("emits defaultContentType in output document", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        @defaultContentType("application/json")
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(): Event;
      `);
      expect(asyncApiDoc?.defaultContentType).toBe("application/json");
    });

    it("omits defaultContentType when not set", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(): Event;
      `);
      expect(asyncApiDoc?.defaultContentType).toBeUndefined();
    });
  });

  describe("multiple @server decorators", () => {
    it("emits all servers in output", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        @server("production", #{ url: "kafka://prod:9092", protocol: "kafka" })
        @server("staging", #{ url: "ws://stage:3000", protocol: "ws" })
        @server("dev", #{ url: "amqp://localhost:5672", protocol: "amqp" })
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(): Event;
      `);
      expect(asyncApiDoc?.servers).toBeDefined();
      const serverKeys = Object.keys(asyncApiDoc?.servers ?? {});
      expect(serverKeys).toHaveLength(3);
      expect(asyncApiDoc?.servers?.production?.host).toBe("kafka://prod:9092");
      expect(asyncApiDoc?.servers?.staging?.host).toBe("ws://stage:3000");
      expect(asyncApiDoc?.servers?.dev?.host).toBe("amqp://localhost:5672");
    });

    it("preserves server descriptions", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka", description: "Production" })
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(): Event;
      `);
      expect(asyncApiDoc?.servers?.prod?.description).toBe("Production");
    });
  });

  describe("void operations", () => {
    it("compiles operation with void return type", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(data: Event): void;
      `);
      expect(doc.operations).toBeDefined();
      const opKeys = Object.keys(doc.operations ?? {});
      expect(opKeys).toHaveLength(1);
    });

    it("compiles operation with return type (message output)", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event { id: string; }
        @channel("events")
        op publish(): Event;
      `);
      expect(doc.operations).toBeDefined();
      const opKeys = Object.keys(doc.operations ?? {});
      expect(opKeys).toHaveLength(1);
    });
  });

  describe("enum with explicit member values", () => {
    it("emits explicit string values for enum members", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        enum Status {
          Active: "active",
          Inactive: "inactive",
          Pending: "pending",
        }
        model Event { status: Status; }
        @channel("events")
        op publish(): Event;
      `);
      const statusSchema = asyncApiDoc?.components?.schemas?.Status;
      expect(statusSchema?.enum).toStrictEqual([
        "active",
        "inactive",
        "pending",
      ]);
    });

    it("emits member names when no explicit value", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        enum Color { Red, Green, Blue }
        model Event { color: Color; }
        @channel("events")
        op publish(): Event;
      `);
      const colorSchema = asyncApiDoc?.components?.schemas?.Color;
      expect(colorSchema?.enum).toStrictEqual(["Red", "Green", "Blue"]);
    });
  });

  describe("@channel with @doc", () => {
    it("propagates @doc to channel description", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        model Event { id: string; }
        @doc("Main event channel")
        @channel("events")
        op publish(): Event;
      `);
      const channels = asyncApiDoc?.channels;
      const channel = channels ? Object.values(channels)[0] : undefined;
      expect(channel?.description).toBe("Main event channel");
    });
  });

  describe("@operationId", () => {
    it("sets custom operation ID in output", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        model Event { id: string; }
        @channel("events")
        @operationId("customPublishOp")
        op publish(): Event;
      `);
      expect(asyncApiDoc?.operations).toBeDefined();
      expect(asyncApiDoc?.operations?.customPublishOp).toBeDefined();
    });
  });

  describe("@messageId", () => {
    it("sets custom message ID in output", async () => {
      const { asyncApiDoc } = await compileAsyncAPI(`
        namespace Test;
        @messageId("userCreatedMsg")
        @message(#{ name: "UserCreated" })
        model UserCreated { id: string; }
        @channel("users")
        op publish(): UserCreated;
      `);
      expect(asyncApiDoc?.components?.messages).toBeDefined();
      const msgKeys = Object.keys(asyncApiDoc?.components?.messages ?? {});
      expect(msgKeys).toContain("userCreatedMsg");
    });
  });
});
