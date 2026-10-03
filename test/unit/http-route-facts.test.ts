/**
 * HTTP Route Facts Tests
 *
 * The guarded accessor must return the exact resolved route table when
 * `@typespec/http` is loaded (mixed programs) and `undefined` when it is not.
 * These facts replace namespace-geometry heuristics for operation ownership.
 */

import { loadHttpRouteFacts } from "../../src/builders/http-route-facts.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import type { Program } from "@typespec/compiler";

describe("loadHttpRouteFacts", () => {
  it("returns undefined when @typespec/http is not loaded", async () => {
    const { program } = await compileAsyncAPI(`
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service {
        op doThing(): string;
      }
    `);
    await expect(loadHttpRouteFacts(program as Program)).resolves.toBeUndefined();
  });

  it("returns undefined for an empty program", async () => {
    const { program } = await compileAsyncAPI(`
      namespace Nothing;
    `);
    await expect(loadHttpRouteFacts(program as Program)).resolves.toBeUndefined();
  });

  it("caches facts per program", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service {
        op doThing(): string;
      }
    `);
    const first = await loadHttpRouteFacts(program as Program);
    const second = await loadHttpRouteFacts(program as Program);
    expect(first).toBeDefined();
    expect(second).toBe(first);
  });

  it("classifies verb-less operations without a body as GET routes", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service {
        op verblessNoBody(): string;
      }
    `);
    const facts = await loadHttpRouteFacts(program as Program);
    expect(facts).toBeDefined();
    const routed = [...(facts?.routes.keys() ?? [])];
    expect(routed).toHaveLength(1);
    expect(facts?.routeOf(routed[0]!)).toStrictEqual({
      path: "/",
      uriTemplate: "/",
      verb: "get",
    });
  });

  it("classifies verb-less operations with a body as POST routes", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service {
        op verblessWithBody(@body body: string): string;
      }
    `);
    const facts = await loadHttpRouteFacts(program as Program);
    const routed = [...(facts?.routes.keys() ?? [])];
    expect(routed).toHaveLength(1);
    expect(facts?.routeOf(routed[0]!)).toMatchObject({ verb: "post" });
  });

  it("reports explicit verbs and @route paths exactly", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @route("/api/v1")
      namespace Service {
        @get
        op explicitGet(): string;

        @route("/custom")
        @put
        op customPut(): string;
      }
    `);
    const facts = await loadHttpRouteFacts(program as Program);
    expect(facts?.routes.size).toBe(2);
    const byName = new Map(
      [...(facts?.routes.entries() ?? [])].map(([op, route]) => [
        op.name,
        route,
      ]),
    );
    expect(byName.get("explicitGet")).toStrictEqual({
      path: "/api/v1",
      uriTemplate: "/api/v1",
      verb: "get",
    });
    expect(byName.get("customPut")).toStrictEqual({
      path: "/api/v1/custom",
      uriTemplate: "/api/v1/custom",
      verb: "put",
    });
  });

  it("routes every operation under a @service namespace, including event ops", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @route("/api/v1")
      namespace Service.Backend;

      model Pong { status: string; }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Service.Backend {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    const facts = await loadHttpRouteFacts(program as Program);
    const receivePing = [...(facts?.routes.keys() ?? [])].find(
      (operation) => operation.name === "receivePing",
    );
    expect(receivePing).toBeDefined();
    expect(facts?.routeOf(receivePing!)).toStrictEqual({
      path: "/api/v1",
      uriTemplate: "/api/v1",
      verb: "get",
    });
    expect(facts?.isRouted(receivePing!)).toBe(true);
  });

  it("does not route operations outside any @service namespace", async () => {
    const { program } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model Pong { status: string; }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    const facts = await loadHttpRouteFacts(program as Program);
    expect(facts?.routes.size ?? 0).toBe(0);
  });
});
