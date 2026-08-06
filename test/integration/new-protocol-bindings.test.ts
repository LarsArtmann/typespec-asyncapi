/**
 * Integration Tests: New Protocol Bindings End-to-End
 *
 * Verifies that solace, anypointmq, and ros2 bindings (the protocols added
 * in the binding protocol gap fix) compile through the full TypeSpec → emitter
 * pipeline and produce valid AsyncAPI 3.1 output. Previously only unit-tested
 * via direct processBindings() calls.
 *
 * Note: ros2 and anypointmq are not in the AsyncAPI 3.1 JSON Schema's binding
 * definitions, so AJV validation is skipped for those. The emitter output is
 * still correct per the @asyncapi/specs binding definitions.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";
import { parse as parseYAML } from "yaml";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

async function compileAndParse(source: string): Promise<ParsedAsyncAPIDocument> {
  const result = await compileAsyncAPISpecWithoutErrors(source);
  for (const [, content] of result.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      return parseYAML(content) as ParsedAsyncAPIDocument;
    }
  }
  throw new Error("No output");
}

describe("integration: new protocol bindings end-to-end", () => {
  it("solace operation bindings compile through emitter without errors", async () => {
    const doc = await compileAndParse(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "solace",
        binding: #{
          bindingVersion: "0.4.0"
        }
      })
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    const [op] = Object.values(doc.operations!);
    expect(op).toBeDefined();
  });

  it("solace namespace bindings validate against AsyncAPI 3.1 schema", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("solace-broker", #{
        url: "tcp://broker.example.com:55555",
        protocol: "solace"
      })
      @bindings(#{
        solace: #{ bindingVersion: "0.4.0" }
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
    expect(server.bindings!.solace.bindingVersion).toBe("0.4.0");
  });

  it("anypointmq bindings compile through emitter without errors", async () => {
    const doc = await compileAndParse(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "anypointmq",
        binding: #{
          bindingVersion: "0.0.1"
        }
      })
      op publish(): Event;
    `);

    expect(doc.channels).toBeDefined();
    const [op] = Object.values(doc.operations!);
    expect(op).toBeDefined();
  });

  it("ros2 bindings compile through emitter without errors", async () => {
    const doc = await compileAndParse(`
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

  it("solace, anypointmq, ros2 are accepted by @protocol decorator", async () => {
    for (const protocol of ["solace", "anypointmq", "ros2"]) {
      const result = await compileAsyncAPISpecWithoutErrors(`
        namespace Test;
        model Event { id: string; }
        @channel("events")
        @protocol(#{
          protocol: "${protocol}",
          binding: #{ bindingVersion: "0.1.0" }
        })
        op publish(): Event;
      `);

      const errorDiagnostics = result.diagnostics.filter((d) => d.severity === "error");
      expect(errorDiagnostics).toHaveLength(0);
    }
  });
});
