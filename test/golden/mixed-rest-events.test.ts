/**
 * Golden lock for the mixed-emitter example (`examples/mixed-rest-events`).
 *
 * Locks the FULL AsyncAPI document produced from the example's main.tsp:
 * exactly the two event channels, no phantom REST operations from the
 * `@service` branch, servers, and the complete $ref chain.
 *
 * The example file on disk is the single source of truth — the test reads it
 * so the lock and the shipped example can never drift apart.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { compileAsyncAPI } from "../utils/test-helpers";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

const GOLDEN_FILE = join(import.meta.dirname, "mixed-rest-events.expected.yaml");
const EXAMPLE_FILE = join(
  import.meta.dirname,
  "../../examples/mixed-rest-events/main.tsp",
);

const expected = YAML.parse(
  readFileSync(GOLDEN_FILE, "utf8"),
) as ParsedAsyncAPIDocument;
const source = readFileSync(EXAMPLE_FILE, "utf8");

describe("golden: mixed-rest-events example (AsyncAPI document)", () => {
  it("emits exactly the locked document", async () => {
    const { allOutputFiles, diagnostics } = await compileAsyncAPI(source);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toStrictEqual([]);
    const yaml = allOutputFiles.get("asyncapi.yaml");
    expect(yaml).toBeDefined();
    const actual = YAML.parse(yaml ?? "") as ParsedAsyncAPIDocument;
    expect(actual).toStrictEqual(expected);
  });

  it("keeps the REST branch out of the event document", () => {
    expect(Object.keys(expected.channels ?? {}).toSorted()).toStrictEqual([
      "health/pong",
      "orders/created",
    ]);
    const operationNames = Object.keys(expected.operations ?? {});
    expect(operationNames).not.toContain("getHealth");
    expect(operationNames).not.toContain("createOrder");
  });
});
