import { createAsyncAPITestHost } from "./test/utils/test-helpers.js";

async function testLibraryLoading() {
  try {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
    `,
    );

    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    console.log(
      "Compilation errors:",
      diagnostics.filter((d) => d.severity === "error").length,
    );
    console.log(
      "All diagnostics:",
      diagnostics.map((d) => `${d.severity}: ${d.message}`).join("\n"),
    );

    // Parse output from real filesystem since test framework capture isn't working
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const yaml = await import("yaml");

    const typeSpecOutputDir = path.join(
      process.cwd(),
      "@lars-artmann",
      "typespec-asyncapi",
    );
    const asyncapiFile = path.join(typeSpecOutputDir, "asyncapi.yaml");

    try {
      const content = await fs.readFile(asyncapiFile, "utf-8");
      const parsed = yaml.parse(content);

      console.log("✅ Parsed AsyncAPI version:", parsed.asyncapi);
      console.log(
        "✅ Parsed channels:",
        parsed.channels ? Object.keys(parsed.channels) : 0,
      );
      console.log(
        "✅ Channel names:",
        parsed.channels ? Object.keys(parsed.channels) : [],
      );
    } catch (error) {
      console.log("❌ Failed to parse generated file:", error.message);
    }
    console.log("TestFileSystem size:", host.fs?.fs?.size || 0);

    // Parse the generated file
    const outputFiles = host.fs?.fs || new Map();
    for (const [fileName, content] of outputFiles) {
      if (fileName.includes("asyncapi")) {
        console.log(`✅ Found file: ${fileName} (${content.length} chars)`);

        // Simple YAML parsing
        const yaml = await import("yaml");
        const parsed = yaml.parse(content as string);
        console.log("✅ Parsed AsyncAPI version:", parsed.asyncapi);
        console.log(
          "✅ Parsed channels:",
          parsed.channels ? Object.keys(parsed.channels) : 0,
        );

        if (parsed.channels) {
          console.log("✅ Channel details:", Object.keys(parsed.channels));
        }
      }
    }
  } catch (error) {
    console.log("ERROR:", error.message);
  }
}

testLibraryLoading();
