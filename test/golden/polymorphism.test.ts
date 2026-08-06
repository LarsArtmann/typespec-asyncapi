import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const GOLDEN_FILE = join(import.meta.dirname, "polymorphism.expected.yaml");

const SOURCE = `
namespace Test;

@discriminator("type")
model Animal {
  type: string;
  name: string;
}

model Dog extends Animal {
  type: "dog";
  breed: string;
}

model Cat extends Animal {
  type: "cat";
  indoor: boolean;
}

@channel("animals")
op publish(): Animal;
`;

describe("golden File Test: Polymorphism", () => {
  it("should produce spec-compliant output with allOf + discriminator", async () => {
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

    expect(actual).toStrictEqual(golden);
  });

  it("should emit discriminator on base model", async () => {
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
    const doc = YAML.parse(output);

    const animal = doc.components.schemas.Animal;
    expect(animal.discriminator).toBe("type");
    expect(animal.properties.type).toStrictEqual({ type: "string" });
    expect(animal.required).toContain("type");
  });

  it("should emit allOf for derived models with $ref to base", async () => {
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
    const doc = YAML.parse(output);

    const dog = doc.components.schemas.Dog;
    expect(dog.allOf).toHaveLength(1);
    expect(dog.allOf[0].$ref).toBe("#/components/schemas/Animal");

    const cat = doc.components.schemas.Cat;
    expect(cat.allOf).toHaveLength(1);
    expect(cat.allOf[0].$ref).toBe("#/components/schemas/Animal");
  });
});
