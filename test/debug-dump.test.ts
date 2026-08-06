import { compileAsyncAPI } from "./utils/test-helpers.js";

it("debug F: enum as property name in value literal", async () => {
  const source = `
    @server("kafka", #{ url: "{broker}.example.com:9092", protocol: "kafka", variables: #{ broker: #{ enum: #["broker1"], default: "broker1" } } })
    namespace Brokered;
    @channel("events")
    op publishEvent(): string;
  `;
  const result = await compileAsyncAPI(source);
  const diags = result.diagnostics.map(d => `${d.code}:${d.message}`);
  expect(`diags=${JSON.stringify(diags)}`).toBe("DUMP");
});

it("debug G: values as property name (alternative)", async () => {
  const source = `
    @server("kafka", #{ url: "{broker}.example.com:9092", protocol: "kafka", variables: #{ broker: #{ values: #["broker1", "broker2", "broker3"], default: "broker1" } } })
    namespace Brokered;
    @channel("events")
    op publishEvent(): string;
  `;
  const result = await compileAsyncAPI(source);
  const diags = result.diagnostics.map(d => d.code);
  const servers = JSON.stringify(result.asyncApiDoc?.servers);
  expect(`diags=${diags} servers=${servers}`).toBe("DUMP");
});
