/**
 * Mixed-emitter behavior: this emitter combined with `@typespec/http`.
 *
 * Locked behaviors:
 * - Event operations (@publish/@subscribe/@channel) inside a @service namespace
 *   warn via `event-op-in-service-namespace` when @typespec/http is loaded.
 * - The warning cites the exact http route (evidence, not heuristics) and is
 *   deduplicated per (service, namespace) with an "N more" suffix.
 * - Events outside the service subtree (the recommended split) stay silent.
 * - AsyncAPI-over-HTTP servers (http/https protocol) are intentional channels,
 *   not accidents, and stay silent.
 * - Without @typespec/http nothing changes, even under a @service namespace.
 * - Bare REST operations under a @service namespace do not leak into the
 *   AsyncAPI document once decorated event ops exist; every exclusion is
 *   signaled via `bare-op-assumed-rest`.
 * - Pure minimal specs (bare ops, no decorators anywhere) keep working.
 */

import {
  compileAsyncAPI,
  compileAsyncAPISpecRaw,
} from "../utils/test-helpers.js";
import type { Diagnostic } from "@typespec/compiler";

const hasWarning = (
  diagnostics: readonly Diagnostic[],
  code: string,
): boolean => diagnostics.some((d) => d.code?.endsWith(code));

const countByCode = (
  diagnostics: readonly Diagnostic[],
  code: string,
): number => diagnostics.filter((d) => d.code?.endsWith(code)).length;

const findByCode = (
  diagnostics: readonly Diagnostic[],
  code: string,
): Diagnostic | undefined => diagnostics.find((d) => d.code?.endsWith(code));

describe("mixed @typespec/http + AsyncAPI programs", () => {
  it("reports the issue #252 spec verbatim: http duplicate errors PLUS our explanatory warnings", async () => {
    // Exact structure from https://github.com/LarsArtmann/typespec-asyncapi/issues/252
    // Model bodies that the issue elided with "{...}" are filled in.
    // Both @subscribe ops land inside the @route("/api/v1") service namespace.
    // @typespec/http routes both as GET /api/v1 and raises duplicate-operation errors.
    // Our warning must still surface ALONGSIDE those errors because the http errors skip emission.
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        model HealthcheckPong {
          status: string;
        }

        @subscribe
        op receivePing(): HealthcheckPong;
      }

      namespace Service.Backend.Module {
        model Response {
          payload: string;
        }

        @subscribe
        op moduleOperation(): Response;
      }
    `);
    expect(countByCode(diagnostics, "@typespec/http/duplicate-operation")).toBe(
      2,
    );
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(2);
  });

  it("warns when a @subscribe operation lives inside the @service namespace", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(hasWarning(diagnostics, "event-op-in-service-namespace")).toBe(true);
  });

  it("does not warn when events live outside the service namespace", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      namespace Rest {
        @route("/api/v1")
        @get
        op getThing(): Pong;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(
      hasWarning(diagnostics, "event-op-in-service-namespace"),
    ).toBeFalsy();
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
    expect(asyncApiDoc.info.title).toBe("Backend");
  });

  it("does not warn for intentional AsyncAPI-over-HTTP servers", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "https",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend.Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(
      hasWarning(diagnostics, "event-op-in-service-namespace"),
    ).toBeFalsy();
  });

  it("does not warn without @typespec/http, even under a @service namespace", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Service.Backend.Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(
      hasWarning(diagnostics, "event-op-in-service-namespace"),
    ).toBeFalsy();
  });

  it("keeps bare REST operations under @service out of the AsyncAPI document", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model Pong {
        status: string;
      }

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      namespace Rest {
        @route("/api/v1")
        @get
        op getThing(): Pong;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
  });

  it("still discovers bare operations in pure minimal specs without http", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      model Pong {
        status: string;
      }

      op receivePing(): Pong;
    `);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
  });

  it("still discovers bare operations when http is loaded but no service exists", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Events {
        @subscribe
        op declared(): Pong;
      }

      namespace Bare {
        op bareOperation(): Pong;
      }
    `);
    expect(Object.keys(asyncApiDoc.channels ?? {}).toSorted()).toStrictEqual([
      "bareOperation",
      "declared",
    ]);
  });

  it("cites the exact http route in the conflict warning", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    const warning = findByCode(diagnostics, "event-op-in-service-namespace");
    expect(warning).toBeDefined();
    expect(warning?.message).toContain("GET /api/v1");
  });

  it("warns exactly once per namespace when several event ops share it", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        @subscribe
        op receivePing(): Pong;

        @subscribe
        op receivePong(): Pong;
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(1);
    const warning = findByCode(diagnostics, "event-op-in-service-namespace");
    expect(warning?.message).toContain("1 more operation(s) in this namespace");
  });

  it("signals every excluded bare operation via bare-op-assumed-rest", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model Pong {
        status: string;
      }

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      namespace Rest {
        @route("/things")
        op getThing(): Pong;

        @route("/stuff")
        @post
        op putThing(): Pong;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(countByCode(diagnostics, "bare-op-assumed-rest")).toBe(2);
    const warning = findByCode(diagnostics, "bare-op-assumed-rest");
    expect(warning?.message).toContain("GET /things");
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
  });

  it("suppresses bare-op-assumed-rest via #suppress", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model Pong {
        status: string;
      }

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      namespace Rest {
        #suppress "@lars-artmann/typespec-asyncapi/bare-op-assumed-rest" "intentional"
        op getThing(): Pong;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Events {
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(countByCode(diagnostics, "bare-op-assumed-rest")).toBe(0);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
  });

  it("silences event-op-in-service-namespace via #suppress", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        #suppress "@lars-artmann/typespec-asyncapi/event-op-in-service-namespace" "intentional"
        @subscribe
        op receivePing(): Pong;
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(0);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "receivePing",
    ]);
  });

  it("warns for @channel-only operations (no @publish/@subscribe)", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      model Pong {
        status: string;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Service.Backend {
        @channel("pong")
        op pong(): Pong;
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(1);
  });

  it("names the innermost @service namespace for nested services", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Outer"})
      @TypeSpec.Http.server("https://outer.service.io", "Production")
      @route("/outer")
      namespace Service.Outer {
        model Pong {
          status: string;
        }

        @TypeSpec.AsyncAPI.server("Production", #{
          url: "my.service.io",
          protocol: "wss",
          pathname: "/api/v1/socket",
        })
        @service(#{title: "Inner"})
        @TypeSpec.Http.server("https://inner.service.io", "Production")
        @route("/inner")
        namespace Inner {
          @subscribe
          op receivePing(): Pong;
        }
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(1);
    const warning = findByCode(diagnostics, "event-op-in-service-namespace");
    expect(warning?.message).toContain("'Inner'");
  });

  it("nearest-ancestor server wins: http AsyncAPI server escapes the warning", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      @TypeSpec.AsyncAPI.server("Root", #{
        url: "root.service.io",
        protocol: "wss",
      })
      namespace Service.Backend {
        model Pong {
          status: string;
        }

        @TypeSpec.AsyncAPI.server("HttpEscape", #{
          url: "my.service.io",
          protocol: "https",
          pathname: "/api/v1/socket",
        })
        namespace Inner {
          @subscribe
          op receivePing(): Pong;
        }
      }
    `);
    expect(
      hasWarning(diagnostics, "event-op-in-service-namespace"),
    ).toBeFalsy();
    expect(asyncApiDoc).not.toBeNull();
  });

  it("nearest-ancestor server wins: wss server under http ancestor still warns", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend;

      @TypeSpec.AsyncAPI.server("HttpAncestor", #{
        url: "my.service.io",
        protocol: "https",
      })
      namespace Service.Backend {
        model Pong {
          status: string;
        }

        @TypeSpec.AsyncAPI.server("WssInner", #{
          url: "socket.service.io",
          protocol: "wss",
        })
        namespace Inner {
          @subscribe
          op receivePing(): Pong;
        }
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(1);
  });

  it("warns for a @service namespace with no AsyncAPI server anywhere", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Service.Backend {
        @channel("pong")
        op pong(): string;
      }
    `);
    expect(countByCode(diagnostics, "event-op-in-service-namespace")).toBe(1);
    expect(asyncApiDoc).not.toBeNull();
  });

  it("discovers bare operations in deeply nested namespaces", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.AsyncAPI;

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
      })
      namespace Deep {
        namespace Deeper {
          namespace Deepest {
            op grandchildEvent(): string;
          }
        }
      }
    `);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual([
      "grandchildEvent",
    ]);
    expect(countByCode(diagnostics, "bare-op-assumed-rest")).toBe(0);
  });
});
