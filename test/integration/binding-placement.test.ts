/**
 * Binding Placement Integration Tests
 *
 * Verifies that misplaced @bindings decorators produce compiler warnings
 * through the full TypeSpec compilation pipeline.
 *
 * Placement matrix (AsyncAPI 3.1):
 *   ws:     channel only
 *   kafka:  channel, operation, message
 *   mqtt:   operation, message, server
 *   http:   operation, message
 *   amqp:   channel, operation, message
 */

import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

const LIB_PREFIX = "@lars-artmann/typespec-asyncapi";

function findWarnings(
  diagnostics: { severity: string; code: string }[],
  code: string,
) {
  return diagnostics.filter(
    (d) => d.severity === "warning" && d.code === `${LIB_PREFIX}/${code}`,
  );
}

describe("binding Placement: misplaced warnings", () => {
  it("warns when ws binding is placed on an Operation", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @publish
      @bindings(#{
        ws: #{
          method: "GET"
        }
      })
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced.length).toBeGreaterThanOrEqual(1);
  });

  it("warns when ws binding is placed on a Model (message)", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @bindings(#{
        ws: #{
          headers: #{
            type: "object"
          }
        }
      })
      model Event {
        id: string;
      }
      @channel("events")
      @publish
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced.length).toBeGreaterThanOrEqual(1);
  });

  it("warns when mqtt binding is placed on a channel via @protocol is NOT flagged (channel config is separate)", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "mqtt",
        binding: #{
          qos: 1
        }
      })
      @publish
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });
});

describe("binding Placement: no false positives", () => {
  it("does NOT warn when kafka binding is placed on an Operation", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @publish
      @bindings(#{
        kafka: #{
          groupId: "my-group",
          clientId: "my-client"
        }
      })
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("does NOT warn when kafka binding is placed on a Model (message)", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @bindings(#{
        kafka: #{
          key: "event-id"
        }
      })
      model Event {
        id: string;
      }
      @channel("events")
      @publish
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });

  it("does NOT warn when amqp binding is placed on an Operation", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @publish
      @bindings(#{
        amqp: #{
          expiration: 1000
        }
      })
      op publishEvent(): Event;
    `);

    const misplaced = findWarnings(result.diagnostics, "misplaced-binding");
    expect(misplaced).toHaveLength(0);
  });
});
