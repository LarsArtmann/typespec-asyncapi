import { compileAsyncAPISpecRaw } from "./test/utils/test-helpers.ts";
import { parse as parseYAML } from "yaml";

async function diag() {
  const src1 = `
    namespace Test;
    model Dog { breed: string; }
    model Cat { whiskers: int32; }
    union Pet { dog: Dog; cat: Cat; }
    @channel("events") op publish(): Pet;
  `;
  const raw1 = await compileAsyncAPISpecRaw(src1, {});
  for (const [, content] of raw1.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("=== Union of models ===");
      console.log(JSON.stringify(doc.components?.schemas?.Pet, null, 2));
    }
  }

  const src2 = `
    namespace Test;
    @discriminator("kind")
    model Animal { kind: string; name: string; }
    model Dog extends Animal { kind: "dog"; breed: string; }
    @channel("events") op publish(): Dog;
  `;
  const raw2 = await compileAsyncAPISpecRaw(src2, {});
  for (const [, content] of raw2.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("\n=== Discriminator model ===");
      console.log("Animal:", JSON.stringify(doc.components?.schemas?.Animal, null, 2));
      console.log("Dog:", JSON.stringify(doc.components?.schemas?.Dog, null, 2));
    }
  }

  const src3 = `
    namespace Test;
    model Event { value: string | int32; }
    @channel("events") op publish(): Event;
  `;
  const raw3 = await compileAsyncAPISpecRaw(src3, {});
  for (const [, content] of raw3.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("\n=== Mixed union ===");
      console.log(JSON.stringify(doc.components?.schemas?.Event?.properties?.value, null, 2));
    }
  }

  // Test 4: Discriminator on union
  const src4 = `
    namespace Test;
    model Success { status: "ok"; data: string; }
    model Error { status: "err"; message: string; }
    @discriminator("status")
    union Result { success: Success; error: Error; }
    @channel("events") op publish(): Result;
  `;
  const raw4 = await compileAsyncAPISpecRaw(src4, {});
  console.log("\n=== Discriminator on union diagnostics ===");
  console.log(JSON.stringify(raw4.diagnostics.map(d => ({code: d.code, severity: d.severity, message: d.message})), null, 2));
  for (const [, content] of raw4.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("Result:", JSON.stringify(doc.components?.schemas?.Result, null, 2));
    }
  }
}

diag().catch(console.error);
