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
      console.log("=== Full schemas ===");
      console.log(Object.keys(doc.components?.schemas ?? {}));
      console.log("\n=== Messages ===");
      console.log(JSON.stringify(doc.components?.messages, null, 2));
      console.log("\n=== Channels ===");
      console.log(JSON.stringify(doc.channels, null, 2));
    }
  }
}

diag().catch(console.error);
