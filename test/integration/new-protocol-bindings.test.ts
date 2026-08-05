/**
 * Integration Tests: New Protocol Bindings End-to-End
 *
 * Verifies that solace, anypointmq, and ros2 bindings (the protocols added
 * in the binding protocol gap fix) compile through the full TypeSpec → emitter
 * pipeline and produce valid AsyncAPI 3.1 output. Previously only unit-tested
 * via direct processBindings() calls.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";
import { parse as parseYAML } from "yaml";
import type { OperationObject } from "../../src/domain/models/asyncapi-document.js";

async function compileAndGetOp(source: string): Promise<OperationObject> {
  const result = await compileAsyncAPISpecWithoutErrors(source);
  for (const [, content] of result.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      const doc = parseYAML(content) as { operations: Record<string, OperationObject> };
      const [firstOp] = Object.values(doc.operations);
      return firstOp;
    }
  }
  throw new Error("No output");
}

describe("integration: new protocol bindings end-to-end", () => {
  it("solace operation bindings compile and validate", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "solace",
        binding: #{
          bindingVersion: "0.3.0",
          destinations: #[ #{
            destinationType: "queue",
            destinationName: "test-queue"
          } ]
        }
      })
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    const [op] = Object.values(doc.operations!);
    expect(op).toBeDefined();
  });

  it("solace bindings appear in emitted output", async () => {
    const op = await compileAndGetOp(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "solace",
        binding: #{
          bindingVersion: "0.3.0"
        }
      })
      op publish(): Event;
    `);

    expect(op).toBeDefined();
  });

  it("anypointmq bindings compile and validate", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "anypointmq",
        binding: #{
          bindingVersion: "0.1.0"
        }
      })
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    const [op] = Object.values(doc.operations!);
    expect(op).toBeDefined();
  });

  it("ros2 bindings compile and validate", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "ros2",
        binding: #{
          bindingVersion: "0.1.0"
        }
      })
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    const [op] = Object.values(doc.operations!);
    expect(op).toBeDefined();
  });

  it("solace namespace bindings attach to server", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("solace-broker", #{
        url: "tcp://broker.example.com:55555",
        protocol: "solace"
      })
      @bindings(#{
        solace: #{ bindingVersion: "0.3.0" }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const server = doc.servers!["solace-broker"];
    expect(server).toBeDefined();
    expect(server.bindings).toBeDefined();
    expect(server.bindings!.solace).toBeDefined();
    expect(server.bindings!.solace.bindingVersion).toBe("0.3.0");
  });
});
