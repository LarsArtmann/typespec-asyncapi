import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const GOLDEN_FILE = join(import.meta.dirname, "tag-rich.expected.yaml");

const SOURCE = `
@tags(#["production", #{ name: "orders", description: "Order management", externalDocs: #{ url: "https://example.com/docs", description: "More info" } }])
namespace Test;

@tags(#["urgent"])
model Order { orderId: string; code: string; }

@channel("orders/{orderId}")
@tags(#["realtime", "urgent"])
op publishOrder(): Order;
`;

function extractOutput(raw: { outputFiles: Map<string, string> }): string {
  for (const [path, content] of raw.outputFiles) {
    if (
      path.includes("asyncapi") &&
      typeof content === "string" &&
      content.startsWith("asyncapi")
    ) {
      return content;
    }
  }
  throw new Error("No asyncapi output file found");
}

describe("golden file: tag-rich output", () => {
  it("should match the golden file exactly", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);

    const errors = raw.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);

    const output = extractOutput(raw);
    const actual = YAML.parse(output);

    const goldenContent = readFileSync(GOLDEN_FILE, "utf8");
    const golden = YAML.parse(goldenContent);

    expect(actual).toStrictEqual(golden);
  });

  it("should have components.tags with rich tag objects", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    expect(doc.components.tags.orders).toStrictEqual({
      name: "orders",
      description: "Order management",
      externalDocs: {
        url: "https://example.com/docs",
        description: "More info",
      },
    });
    expect(doc.components.tags.production).toStrictEqual({
      name: "production",
    });
  });

  it("should populate info.tags with all unique tags", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    expect(doc.info.tags).toHaveLength(4);
    const names = doc.info.tags.map((t: { name: string }) => t.name).toSorted();
    expect(names).toStrictEqual(["orders", "production", "realtime", "urgent"]);
  });
});
