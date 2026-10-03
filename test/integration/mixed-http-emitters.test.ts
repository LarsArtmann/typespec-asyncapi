/**
 * Mixed-emitter behavior: this emitter combined with `@typespec/http`.
 *
 * Locked behaviors:
 * - Event operations (@publish/@subscribe/@channel) inside a @service namespace
 *   warn via `event-op-in-service-namespace` when @typespec/http is loaded.
 * - Events outside the service subtree (the recommended split) stay silent.
 * - AsyncAPI-over-HTTP servers (http/https protocol) are intentional channels,
 *   not accidents, and stay silent.
 * - Without @typespec/http nothing changes, even under a @service namespace.
 * - Bare REST operations under a @service namespace do not leak into the
 *   AsyncAPI document once decorated event ops exist.
 * - Pure minimal specs (bare ops, no decorators anywhere) keep working.
 */

import {
  compileAsyncAPI,
  compileAsyncAPISpecRaw,
} from "../utils/test-helpers.js";
import type { Diagnostic } from "@typespec/compiler";

const hasWarning = (diagnostics: readonly Diagnostic[], code: string): boolean =>
  diagnostics.some((d) => d.code?.endsWith(code));

const countByCode = (diagnostics: readonly Diagnostic[], code: string): number =>
  diagnostics.filter((d) => d.code?.endsWith(code)).length;

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
    expect(countByCode(diagnostics, "@typespec/http/duplicate-operation")).toBe(2);
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
    expect(hasWarning(diagnostics, "event-op-in-service-namespace")).toBeFalsy();
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual(["receivePing"]);
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
    expect(hasWarning(diagnostics, "event-op-in-service-namespace")).toBeFalsy();
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
    expect(hasWarning(diagnostics, "event-op-in-service-namespace")).toBeFalsy();
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
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual(["receivePing"]);
  });

  it("still discovers bare operations in pure minimal specs without http", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      model Pong {
        status: string;
      }

      op receivePing(): Pong;
    `);
    expect(Object.keys(asyncApiDoc.channels ?? {})).toStrictEqual(["receivePing"]);
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
});
