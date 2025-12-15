import {
  createAsyncAPITestHost,
  compileAsyncAPISpecRaw,
  parseAsyncAPIOutput,
} from "./test/utils/test-helpers.js";

async function test() {
  const host = await createAsyncAPITestHost();

  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace Test {
  @channel("test.channel")
  @publish
  op publishTest(): string;
}
  `;

  host.addTypeSpecFile("main.tsp", sourceCode);

  try {
    // Compile with emitter
    const hostResult = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    console.log("Compilation errors:", diagnostics.filter((d) => d.severity === "error").length);
    console.log("TestFileSystem files:", host.fs?.fs?.size || 0);

    // Use parseAsyncAPIOutput that handles both test framework and real FS
    const parsed = await parseAsyncAPIOutput(host.fs?.fs || new Map(), "asyncapi.yaml");
    console.log("Parsed result:", parsed?.asyncapi ? "SUCCESS" : "FAILED");
    console.log("AsyncAPI version:", parsed?.asyncapi);
    console.log("Channels count:", parsed?.channels ? Object.keys(parsed.channels).length : 0);

    if (parsed?.channels) {
      console.log("Channel details:", Object.keys(parsed.channels));
    }
    if (parsed?.operations) {
      console.log("Operations count:", Object.keys(parsed.operations).length);
      console.log("Operation details:", Object.keys(parsed.operations));
    }
  } catch (error) {
    console.log("ERROR:", error.message);
    console.log("ERROR STACK:", error.stack);
  }
}

test().catch(console.error);
