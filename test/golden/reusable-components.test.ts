import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

const GOLDEN_FILE = join(
  import.meta.dirname,
  "reusable-components.expected.yaml",
);

const SOURCE = `
@operationTrait("standardOps", #{
  description: "Standard operation trait",
  summary: "Standard"
})
@messageTrait("defaultMsg", #{
  contentType: "application/json",
  description: "Default message trait"
})
@reusableCorrelationId("defaultCorrelation", "$message.header#/correlationId")
@reusableBinding("stdKafka", #{ kafka: #{ bindingVersion: "0.5.0" } })
namespace Test;

model UserEvent {
  @doc("User identifier")
  userId: string;
  event: string;
}

@channel("user.events")
@useOperationTrait("standardOps")
@useBinding("stdKafka")
@tags(#["user", "events"])
op publishUserEvent(): UserEvent;

@channel("user.events")
@subscribe
@useOperationTrait("standardOps")
op subscribeUserEvent(): UserEvent;
`;

describe("golden File Test: Reusable Components", () => {
  it("should produce spec-compliant output with components.* populated", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);

    const errors = raw.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);

    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    expect(output.length).toBeGreaterThan(0);

    const actual = YAML.parse(output);

    const goldenContent = readFileSync(GOLDEN_FILE, "utf8");
    const golden = YAML.parse(goldenContent);

    expect(actual.components.operationTraits).toStrictEqual(
      golden.components.operationTraits,
    );
    expect(actual.components.messageTraits).toStrictEqual(
      golden.components.messageTraits,
    );
    expect(actual.components.correlationIds).toStrictEqual(
      golden.components.correlationIds,
    );
    expect(actual.components.operationBindings).toStrictEqual(
      golden.components.operationBindings,
    );
    expect(actual.components.tags).toStrictEqual(golden.components.tags);
    expect(actual.info.tags).toStrictEqual(golden.info.tags);
  });

  it("should produce valid $ref pointers for reusable components", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    const doc = YAML.parse(output) as ParsedAsyncAPIDocument;

    const op = doc.operations?.publishUserEvent;
    expect(op?.traits?.[0]?.$ref).toBe(
      "#/components/operationTraits/standardOps",
    );
    expect(op?.bindings?.$ref).toBe("#/components/operationBindings/stdKafka");
  });

  it("should match golden file exactly", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    const actual = YAML.parse(output);
    const goldenContent = readFileSync(GOLDEN_FILE, "utf8");
    const golden = YAML.parse(goldenContent);

    expect(actual).toStrictEqual(golden);
  });
});
