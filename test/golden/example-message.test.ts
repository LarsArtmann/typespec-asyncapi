import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const GOLDEN_FILE = join(import.meta.dirname, "example-message.expected.yaml");

const SOURCE = `
namespace Test;

@message(#{title: "User Event"})
@example(#{ id: 1, name: "Alice", email: "alice@example.com" })
model UserEvent { id: int32; name: string; email: string; }

@channel("users")
op publishUser(): UserEvent;
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

describe("golden file: @example message output", () => {
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

  it("should populate message-level examples from @example", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    const msg = doc.components.messages.UserEvent;
    expect(msg.examples).toHaveLength(1);
    expect(msg.examples[0].payload).toStrictEqual({
      id: 1,
      name: "Alice",
      email: "alice@example.com",
    });
  });

  it("should also populate schema-level examples", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    const schema = doc.components.schemas.UserEvent;
    expect(schema.examples).toHaveLength(1);
    expect(schema.examples[0]).toStrictEqual({
      id: 1,
      name: "Alice",
      email: "alice@example.com",
    });
  });
});
