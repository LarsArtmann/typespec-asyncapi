/**
 * Golden Locks: Named Unions, Template Instantiations, Protocol Bindings
 *
 * Byte-level locks (AST-compared) for outputs that previously had no golden:
 * - `oneOf` over all-Model union variants (named union)
 * - Generic instantiation declaration names (`Page<User>` → `PageUser`)
 * - `@protocol`-derived channel/operation bindings across kafka/http/ws
 *
 * Regenerate the `.expected.yaml` files after an INTENTIONAL output change
 * by re-running the fixture compile and reviewing the diff.
 */

import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

function goldenPath(name: string): string {
  return join(import.meta.dirname, `${name}.expected.yaml`);
}

/** Compile a fixture, assert zero errors, and parse the main YAML output. */
async function compileAndParse(source: string): Promise<Record<string, unknown>> {
  const raw = await compileAsyncAPISpecRaw(source);
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
  return YAML.parse(output) as Record<string, unknown>;
}

function readGolden(name: string): Record<string, unknown> {
  return YAML.parse(readFileSync(goldenPath(name), "utf8"));
}

const NAMED_UNION_SOURCE = `
namespace Test;

model TextContent {
  body: string;
}

model ImageContent {
  url: string;
  width: int32;
}

model Message {
  content: TextContent | ImageContent;
}

@channel("messages")
op publish(): Message;
`;

const TEMPLATE_INSTANTIATION_SOURCE = `
namespace Test;

model Page<T> {
  items: T[];
  nextLink: string;
}

model User {
  id: string;
  name: string;
}

model Box<T extends string> {
  value: T;
}

@channel("users.page")
op publishUsers(): Page<User>;
`;

const PROTOCOL_BINDINGS_SOURCE = `
@server("kafka-prod", #{
  url: "kafka://broker:9092",
  protocol: "kafka",
})
namespace Test;

model OrderEvent {
  orderId: string;
}

@channel("orders.created")
@protocol(#{ protocol: "kafka", partitions: 3, replicationFactor: 2 })
@publish
op publishOrder(): OrderEvent;

@channel("orders.status")
@protocol(#{ protocol: "http", binding: #{ method: "POST" } })
@publish
op publishStatus(): OrderEvent;

@channel("orders.live")
@protocol(#{ protocol: "ws", queryParams: #{ trace: "1" } })
@publish
op publishLive(): OrderEvent;
`;

describe("golden locks", () => {
  it("named union emits oneOf over named model refs (byte-locked)", async () => {
    const actual = await compileAndParse(NAMED_UNION_SOURCE);
    expect(actual).toStrictEqual(readGolden("named-union"));
  });

  it("template instantiation emits framework-named declarations (byte-locked)", async () => {
    const actual = await compileAndParse(TEMPLATE_INSTANTIATION_SOURCE);
    expect(actual).toStrictEqual(readGolden("template-instantiation"));
  });

  it("@protocol bindings across kafka/http/ws (byte-locked)", async () => {
    const actual = await compileAndParse(PROTOCOL_BINDINGS_SOURCE);
    expect(actual).toStrictEqual(readGolden("protocol-bindings"));
  });
});
