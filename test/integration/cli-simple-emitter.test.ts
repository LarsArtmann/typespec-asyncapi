import { describe, test, expect } from "vitest";
import { compileWithCLI } from "../utils/cli-test-helpers.js";
import type { CLITestResult } from "../utils/cli-test-helpers.js";
import {
  assertAsyncAPIDoc,
  assertCompilationSuccess,
  getPropertyKeys,
} from "../utils/type-guards.js";

describe("CLI Tests: Simple AsyncAPI Emitter", () => {
  let testResult: CLITestResult | undefined;

  test("should generate basic AsyncAPI from simple TypeSpec", async () => {
    const source = `
      namespace SimpleTest;

      model SimpleEvent {
        id: string;
        message: string;
        timestamp: utcDateTime;
      }

      @channel("simple.event")
      op publishSimpleEvent(): SimpleEvent;
    `;

    testResult = await compileWithCLI(source);

    assertCompilationSuccess(testResult);
    assertAsyncAPIDoc(testResult.asyncapiDoc);

    const channelKeys = getPropertyKeys(testResult.asyncapiDoc.channels);
    expect(channelKeys).toContain("simple.event");
  });

  test("should handle multiple operations", async () => {
    const source = `
      namespace MultiOp;

      model UserEvent {
        userId: string;
        action: string;
      }

      model SystemEvent {
        component: string;
        level: string;
      }

      @channel("user.events")
      op publishUserEvent(): UserEvent;

      @channel("system.events")
      op publishSystemEvent(): SystemEvent;
    `;

    testResult = await compileWithCLI(source);

    expect(testResult.exitCode).toBe(0);
    assertAsyncAPIDoc(testResult.asyncapiDoc);

    const operationKeys = Object.keys(testResult.asyncapiDoc.operations);
    expect(operationKeys).toContain("publishUserEvent");
    expect(operationKeys).toContain("publishSystemEvent");
    expect(testResult.asyncapiDoc.info.title).toBeDefined();
  });

  test("should generate YAML output", async () => {
    const source = `
      namespace YamlTest;

      model TestEvent {
        id: string;
        data: string;
      }

      @channel("test.events")
      op publishTest(): TestEvent;
    `;

    testResult = await compileWithCLI(source);

    expect(testResult.exitCode).toBe(0);
    assertAsyncAPIDoc(testResult.asyncapiDoc);
    expect(testResult.asyncapiDoc.asyncapi).toBe("3.1.0");

    const channelKeys = Object.keys(testResult.asyncapiDoc.channels);
    expect(channelKeys).toContain("test.events");
  });

  test("should include schema components for models", async () => {
    const source = `
      namespace SchemaTest;

      model DetailedEvent {
        eventId: string;
        eventType: "create" | "update" | "delete";
        payload: {
          field1: string;
          field2: int32;
        };
      }

      @channel("detailed.events")
      op publishDetailed(): DetailedEvent;
    `;

    testResult = await compileWithCLI(source);

    expect(testResult.exitCode).toBe(0);
    expect(testResult.asyncapiDoc?.components).toBeDefined();
    expect(testResult.asyncapiDoc?.components?.schemas).toBeDefined();
  });

  test("should handle namespaces correctly", async () => {
    const source = `
      namespace MyAPI.Events;

      model NotificationEvent {
        notificationId: string;
        message: string;
      }

      @channel("notifications.sent")
      op sendNotification(): NotificationEvent;
    `;

    testResult = await compileWithCLI(source);

    expect(testResult.exitCode).toBe(0);
    assertAsyncAPIDoc(testResult.asyncapiDoc);

    const channelKeys = Object.keys(testResult.asyncapiDoc.channels);
    expect(channelKeys).toContain("notifications.sent");
  });
});
