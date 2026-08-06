/**
 * Adapted fixture: Azure EventGrid CloudEvent → AsyncAPI
 *
 * Source: Azure EventGrid Namespace REST API spec
 * (microsoft/EventGrid — Namespace Manager)
 *
 * The original spec is a full Azure REST API using @azure-tools/typespec-azure-core.
 * This adapted fixture extracts the CloudEvent model (CloudEvents 1.0 spec)
 * and wraps it in an AsyncAPI operation.
 *
 * Patterns tested:
 * - Complex model with many properties (10+)
 * - bytes / base64 data
 * - Optional fields with defaults
 * - utcDateTime
 * - Mixed required/optional
 */

import { compileAsyncAPI } from "../../utils/test-helpers.js";

describe("adapted: Azure EventGrid CloudEvent", () => {
  const source = `
    import "@lars-artmann/typespec-asyncapi";
    using TypeSpec.AsyncAPI;

    namespace EventGrid;

    model CloudEvent {
      id: string;
      source: string;
      type: string;
      specversion: string;

      @doc("Event data specific to the event type")
      data?: unknown;

      @doc("Content type of data value")
      datacontenttype?: string;

      @doc("Time when the event occurred")
      time?: utcDateTime;

      @doc("Subject of the event")
      subject?: string;

      @doc("Base64 encoded data")
      data_base64?: bytes;
    }

    model BrokerProperties {
      sequenceNumber: int64;
      offset: int64;
      partitionKey?: string;
      enqueuedTime: utcDateTime;
    }

    model ReceiveDetails {
      maxEvents: int32;
      maxWaitTime: int32;
    }

    @channel("events.publish")
    @publish
    op publishEvent(): CloudEvent;

    @channel("events.acknowledge")
    @publish
    op acknowledgeEvent(): BrokerProperties;
  `;

  it("compiles without errors", async () => {
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("emits unknown type for data property", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.CloudEvent;
    expect(evt?.properties?.data).toBeDefined();
  });

  it("emits bytes as string with byte format", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.CloudEvent;
    expect(evt?.properties?.data_base64).toMatchObject({
      type: "string",
      format: "byte",
    });
  });

  it("emits utcDateTime as string with date-time format", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.CloudEvent;
    expect(evt?.properties?.time).toMatchObject({
      type: "string",
      format: "date-time",
    });
  });

  it("correctly marks required vs optional properties", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.CloudEvent;
    expect(evt?.required).toContain("id");
    expect(evt?.required).toContain("source");
    expect(evt?.required).toContain("type");
    expect(evt?.required).toContain("specversion");
    expect(evt?.required).not.toContain("data");
    expect(evt?.required).not.toContain("time");
    expect(evt?.required).not.toContain("subject");
  });

  it("emits BrokerProperties with int64 fields", async () => {
    const result = await compileAsyncAPI(source);
    const broker = result.asyncApiDoc?.components?.schemas?.BrokerProperties;
    expect(broker?.properties?.sequenceNumber).toMatchObject({
      type: "integer",
      format: "int64",
    });
    expect(broker?.properties?.offset).toMatchObject({
      type: "integer",
      format: "int64",
    });
  });

  it("produces valid channels and operations", async () => {
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.channels?.["events.publish"]).toBeDefined();
    expect(result.asyncApiDoc?.channels?.["events.acknowledge"]).toBeDefined();
    expect(result.asyncApiDoc?.operations?.publishEvent).toBeDefined();
    expect(result.asyncApiDoc?.operations?.acknowledgeEvent).toBeDefined();
  });
});
