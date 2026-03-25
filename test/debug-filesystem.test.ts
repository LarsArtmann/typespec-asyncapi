import { describe, it } from "bun:test";
import { createAsyncAPITestHost } from "./utils/test-helpers.js";

describe("DEBUG: File System Access", () => {
  it("should check if library files are accessible", async () => {
    const host = await createAsyncAPITestHost();

    console.log("=== File System Access Debug ===");

    // List all available files
    try {
      const allFiles = Array.from(host.fs.entries()).map(([path]) => path);
      console.log("📁 All files in virtual filesystem (", allFiles.length, "):");

      // Filter for our library files
      const asyncAPIFiles = allFiles.filter(
        (file) =>
          file.includes("asyncapi") ||
          file.includes("lars-artmann") ||
          file.includes("/lib/") ||
          file.includes("/dist/"),
      );

      console.log("🔍 Files related to our library:");
      asyncAPIFiles.forEach((file) => console.log(`  ${String(file)}`));

      if (asyncAPIFiles.length === 0) {
        console.log("❌ NO AsyncAPI library files found in virtual filesystem!");
      }
    } catch (error) {
      console.log("❌ Cannot list files:", error.message);
    }

    // Check if our library is actually registered
    const libraries = host.libraries;
    console.log("📚 Registered libraries:");
    Object.entries(libraries).forEach(([key, lib]) => {
      console.log(`  ${key}: ${lib.name}`);
    });
  });
});
