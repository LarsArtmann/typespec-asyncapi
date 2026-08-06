import { compileAsyncAPI } from "./utils/test-helpers.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

it("compile actual streetlights file", async () => {
  const source = readFileSync(
    join(import.meta.dirname, "realworld", "fixtures", "streetlights-mqtt.tsp"),
    "utf8",
  );
  console.log("SOURCE LENGTH:", source.length);
  console.log("FIRST 100 CHARS:", JSON.stringify(source.substring(0, 100)));
  console.log("HAS @channel:", source.includes("@channel"));
  console.log("HAS @publish:", source.includes("@publish"));
  console.log("HAS namespace:", source.includes("namespace"));
  const result = await compileAsyncAPI(source);
  console.log("DOC NULL:", result.asyncApiDoc === null);
  console.log(
    "ALL DIAGNOSTICS:",
    JSON.stringify(
      result.diagnostics.map((d) => ({
        code: d.code,
        severity: d.severity,
        message: d.message,
      })),
      null,
      2,
    ),
  );
});

it("compile streetlights without header comments", async () => {
  const source = readFileSync(
    join(import.meta.dirname, "realworld", "fixtures", "streetlights-mqtt.tsp"),
    "utf8",
  );
  // Remove the header comment block
  const withoutComments = source.replace(/^\/\/.*$/gm, "").trim();
  const result = await compileAsyncAPI(withoutComments);
  console.log("NO_COMMENTS DOC NULL:", result.asyncApiDoc === null);
  console.log(
    "NO_COMMENTS OPS:",
    Object.keys(result.asyncApiDoc?.operations ?? {}),
  );
});
