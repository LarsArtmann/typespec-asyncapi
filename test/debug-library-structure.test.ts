import { describe, it, expect } from "bun:test";

describe("DEBUG: Library Structure", () => {
  it("should verify library exports", async () => {
    console.log("🔍 DEBUG: Loading library...");
    
    try {
      // Import TypeScript file directly
      const library = await import("../src/index.ts");
      console.log("🔍 DEBUG: Library loaded successfully");
      console.log("🔍 DEBUG: Library keys:", Object.keys(library));
      console.log("🔍 DEBUG: Has $decorators:", "$decorators" in library);
      
      if ("$decorators" in library) {
        const decorators = (library as any).$decorators;
        console.log("🔍 DEBUG: Decorators structure:", decorators);
        console.log("🔍 DEBUG: Decorator namespaces:", Object.keys(decorators));
        
        if (decorators.AsyncAPI) {
          console.log("🔍 DEBUG: AsyncAPI decorators:", Object.keys(decorators.AsyncAPI));
          console.log("🔍 DEBUG: Has channel:", "channel" in decorators.AsyncAPI);
          console.log("🔍 DEBUG: Has publish:", "publish" in decorators.AsyncAPI);
        }
      }
      
      expect(true).toBe(true);
    } catch (error) {
      console.log("❌ DEBUG: Library load failed:", error);
      expect(false).toBe(true);
    }
  });
});