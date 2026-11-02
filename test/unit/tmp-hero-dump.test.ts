import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const source = `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Orders" })
namespace Orders;

model OrderPlaced {
  orderId: string;
  total: decimal;
  placedAt: utcDateTime;
}

@channel("orders.placed")
@publish
@protocol(#{ protocol: "kafka", topic: "orders.placed" })
op publishOrderPlaced(): OrderPlaced;
`;

describe("hero dump", () => {
  it("dumps", { timeout: 120_000 }, async () => {
    const result = await compileAsyncAPI(source);
    const yaml = result.allOutputFiles.get("asyncapi.yaml") ?? "";
    writeFileSync("/tmp/hero-asyncapi.yaml", yaml, "utf8");
    writeFileSync(
      "/tmp/hero-diagnostics.json",
      JSON.stringify(
        result.diagnostics.map((d) => ({ code: d.code, message: d.message })),
        null,
        2,
      ),
      "utf8",
    );
    console.log("LEN", yaml.length);
  });
});
