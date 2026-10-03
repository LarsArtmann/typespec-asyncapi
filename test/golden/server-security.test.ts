import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const GOLDEN_FILE = join(import.meta.dirname, "server-security.expected.yaml");

const SOURCE = `
@server("prod", #{
  url: "broker.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka broker"
})
@security(#{
  name: "brokerAuth",
  scheme: #{
    type: "userPassword",
    description: "Broker credentials"
  }
})
@security(#{
  name: "scramAuth",
  scheme: #{
    type: "scramSha256",
    description: "SCRAM authentication"
  }
})
namespace Test;

model Event { id: string; }

@channel("events")
op publish(): Event;
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

describe("golden file: server security output", () => {
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

  it("should populate components.securitySchemes with both schemes", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    expect(
      Object.keys(doc.components.securitySchemes).toSorted(),
    ).toStrictEqual(["brokerAuth", "scramAuth"]);
  });

  it("should have correct scheme types", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    const doc = YAML.parse(extractOutput(raw));

    expect(doc.components.securitySchemes.brokerAuth.type).toBe("userPassword");
    expect(doc.components.securitySchemes.scramAuth.type).toBe("scramSha256");
  });
});
