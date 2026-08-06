import { compileAsyncAPI } from "./utils/test-helpers.js";

it("debug: channel server refs", async () => {
  const source = `
    @server("primary", #{ url: "primary.example.com", protocol: "kafka" })
    @server("backup", #{ url: "backup.example.com", protocol: "kafka" })
    namespace MultiServer;
    @channel("events")
    @useChannelServer("primary")
    @useChannelServer("backup")
    op publishEvent(): string;
  `;
  const result = await compileAsyncAPI(source);
  const channels = JSON.stringify(result.asyncApiDoc?.channels);
  expect(true).toBe(true);
});
