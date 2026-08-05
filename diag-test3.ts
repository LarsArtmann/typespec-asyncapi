import { compileAsyncAPISpecRaw } from "./test/utils/test-helpers.ts";
import { parse as parseYAML } from "yaml";

async function diag() {
  // Union as property type
  const src1 = `
    namespace Test;
    model Dog { breed: string; }
    model Cat { whiskers: int32; }
    model Owner { pet: Dog | Cat; }
    @channel("events") op publish(): Owner;
  `;
  const raw1 = await compileAsyncAPISpecRaw(src1, {});
  for (const [, content] of raw1.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("=== Union as property ===");
      console.log("Owner:", JSON.stringify(doc.components?.schemas?.Owner, null, 2));
    }
  }

  // Named union as property type
  const src2 = `
    namespace Test;
    model Dog { breed: string; }
    model Cat { whiskers: int32; }
    union Pet { dog: Dog; cat: Cat; }
    model Owner { pet: Pet; }
    @channel("events") op publish(): Owner;
  `;
  const raw2 = await compileAsyncAPISpecRaw(src2, {});
  for (const [, content] of raw2.outputFiles) {
    if (content.startsWith("asyncapi")) {
      const doc = parseYAML(content);
      console.log("\n=== Named union as property ===");
      console.log("Owner:", JSON.stringify(doc.components?.schemas?.Owner, null, 2));
      console.log("Schemas:", Object.keys(doc.components?.schemas ?? {}));
    }
  }
}

diag().catch(console.error);
