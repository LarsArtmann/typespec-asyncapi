/**
 * Integration test using programmatic TypeSpec compiler API
 * Verifies the emitter produces valid AsyncAPI 3.1 end-to-end.
 */

import {
  compileAsyncAPISpecWithoutErrors,
  parseAsyncAPIOutput,
} from "../utils/test-helpers.js";

describe("real Compilation Integration Test", () => {
  it("should compile TypeSpec to AsyncAPI 3.1 using programmatic API", async () => {
    const source = `
      namespace IntegrationTest;

      /**
       * Test event model
       */
      model TestEvent {
        id: string;
        timestamp: utcDateTime;
        data: string;
      }

      @channel("test.events")
      op publishTestEvent(): TestEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);
    const asyncapi = await parseAsyncAPIOutput(outputFiles);

    expect(asyncapi.asyncapi).toBe("3.1.0");
    expect(asyncapi.info).toBeDefined();
    expect(asyncapi.info.title).toBeDefined();
    expect(asyncapi.info.version).toBeDefined();

    expect(asyncapi.channels).toBeDefined();
    expect(Object.keys(asyncapi.channels).length).toBeGreaterThan(0);

    expect(asyncapi.operations).toBeDefined();
    expect(Object.keys(asyncapi.operations).length).toBeGreaterThan(0);

    expect(asyncapi.components).toBeDefined();
    expect(asyncapi.components.schemas).toBeDefined();
    expect(asyncapi.components.schemas?.TestEvent).toBeDefined();

    expect(
      asyncapi.components.schemas?.TestEvent?.properties?.id,
    ).toBeDefined();
    expect(
      asyncapi.components.schemas?.TestEvent?.properties?.timestamp,
    ).toBeDefined();
    expect(
      asyncapi.components.schemas?.TestEvent?.properties?.data,
    ).toBeDefined();
  });
});
