import YAML from "yaml";
import { heroAsyncAPI, heroTypeSpec } from "../../website/src/data/hero.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { validateAsyncAPIDocument } from "../utils/schema-validator.js";

describe("landing page hero fixture", () => {
  it("is exactly what the emitter produces from the hero source", async () => {
    const result = await compileAsyncAPI(heroTypeSpec);
    const errors = result.diagnostics.filter(
      (diagnostic) => String(diagnostic.severity) === "error",
    );
    expect(errors.map((diagnostic) => diagnostic.message)).toStrictEqual([]);

    const emitted = result.allOutputFiles.get("asyncapi.yaml") ?? "";
    expect(emitted).toBe(heroAsyncAPI);
  });

  it("validates against the official AsyncAPI 3.1.0 schema", () => {
    const document = YAML.parse(heroAsyncAPI) as ParsedAsyncAPIDocument;
    expect(() => {
      validateAsyncAPIDocument(document);
    }).not.toThrow();
  });
});
