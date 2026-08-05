/**
 * @typespec/versioning Integration Tests
 *
 * Verifies that the emitter correctly handles @versioned namespaces from
 * the @typespec/versioning library:
 *
 * 1. Versioned namespaces compile without errors
 * 2. The latest version value from @versioned enum is used for info.version
 * 3. @apiVersion overrides @versioned (explicit > inferred)
 * 4. @added/@removed decorators work with version projection
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("versioning: @versioned namespace integration", () => {
  it("compiles a @versioned namespace without errors", async () => {
    const doc = await compileAndValidateOrThrow(`
      import "@typespec/versioning";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Versioning;
      using TypeSpec.AsyncAPI;

      @versioned(Versions)
      namespace MyService;

      enum Versions {
        v1: "1.0.0",
        v2: "2.0.0",
      }

      model Event { id: string; }

      @channel("events")
      op publish(): Event;
    `);
    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.channels).toBeDefined();
  });

  it("uses the latest version value from @versioned enum for info.version", async () => {
    const doc = await compileAndValidateOrThrow(`
      import "@typespec/versioning";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Versioning;
      using TypeSpec.AsyncAPI;

      @versioned(Versions)
      namespace MyService;

      enum Versions {
        v1: "1.0.0",
        v2: "2.0.0",
        v3: "3.0.0",
      }

      model Event { id: string; }

      @channel("events")
      op publish(): Event;
    `);
    expect(doc.info.version).toBe("3.0.0");
  });

  it("@apiVersion overrides @versioned enum value", async () => {
    const doc = await compileAndValidateOrThrow(`
      import "@typespec/versioning";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Versioning;
      using TypeSpec.AsyncAPI;

      @versioned(Versions)
      @apiVersion("9.9.9")
      namespace MyService;

      enum Versions {
        v1: "1.0.0",
        v2: "2.0.0",
      }

      model Event { id: string; }

      @channel("events")
      op publish(): Event;
    `);
    expect(doc.info.version).toBe("9.9.9");
  });

  it("compiles with @added decorator on model", async () => {
    const doc = await compileAndValidateOrThrow(`
      import "@typespec/versioning";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Versioning;
      using TypeSpec.AsyncAPI;

      @versioned(Versions)
      namespace MyService;

      enum Versions {
        v1: "1.0.0",
        v2: "2.0.0",
      }

      model Event { id: string; }

      @added(Versions.v2)
      @channel("new-events")
      op publishNew(): NewEvent;

      @added(Versions.v2)
      model NewEvent { id: string; type: string; }

      @channel("events")
      op publish(): Event;
    `);
    expect(doc.components?.schemas?.NewEvent).toBeDefined();
  });

  it("non-versioned namespace still defaults to 1.0.0", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(doc.info.version).toBe("1.0.0");
  });
});
