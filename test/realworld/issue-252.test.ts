/**
 * Realworld regression for issue #252: a mixed @typespec/http + AsyncAPI
 * program. The fixture mirrors the reporter's spec 1:1.
 *
 * Locked contract:
 * - VERBATIM reporter spec: @typespec/http raises duplicate-operation errors
 *   (both event ops phantom-route as GET /api/v1), the emitter's explanatory
 *   warnings still surface, and the http errors skip emission entirely.
 * - RECOMMENDED SPLIT (events outside the @service subtree): a clean AsyncAPI
 *   document with exactly the event operations, zero warnings, no REST leak.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createTester,
  findTestPackageRoot,
} from "@typespec/compiler/testing";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const fixture = readFileSync(
  join(import.meta.dirname, "fixtures", "issue-252.tsp"),
  "utf8",
);

const countByCode = (
  diagnostics: readonly { code?: string }[],
  code: string,
): number => diagnostics.filter((d) => d.code?.endsWith(code)).length;

describe("issue #252: mixed openapi3 + asyncapi program", () => {
  it("verbatim reporter spec: http duplicate errors + our warnings, emission skipped", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(fixture);
    expect(
      countByCode(diagnostics, "@typespec/http/duplicate-operation"),
    ).toBe(2);
    expect(
      countByCode(diagnostics, "event-op-in-service-namespace"),
    ).toBe(2);
    expect(asyncApiDoc).toBeNull();
  });

  it("recommended split: clean AsyncAPI document with exactly the event operations", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      import "@typespec/http";
      import "@lars-artmann/typespec-asyncapi";

      using TypeSpec.Http;
      using TypeSpec.AsyncAPI;

      model HealthcheckPong {
        status: string;
      }

      model ModuleResponse {
        payload: string;
      }

      @service(#{title: "Backend"})
      @TypeSpec.Http.server("https://my.service.io", "Production")
      @route("/api/v1")
      namespace Rest {
        @get
        op healthcheck(): HealthcheckPong;
      }

      @TypeSpec.AsyncAPI.server("Production", #{
        url: "my.service.io",
        protocol: "wss",
        pathname: "/api/v1/socket",
      })
      namespace Events {
        @subscribe
        op receivePing(): HealthcheckPong;

        @subscribe
        op moduleOperation(): ModuleResponse;
      }
    `);
    expect(
      countByCode(diagnostics, "event-op-in-service-namespace"),
    ).toBe(0);
    expect(countByCode(diagnostics, "bare-op-assumed-rest")).toBe(1);
    expect(asyncApiDoc).not.toBeNull();
    expect(Object.keys(asyncApiDoc?.channels ?? {}).toSorted()).toStrictEqual([
      "moduleOperation",
      "receivePing",
    ]);
  });

  it("documents the http-side friction: the OpenAPI emitter yields no output", async () => {
    const packageRoot = await findTestPackageRoot(import.meta.url);
    const tester = createTester(packageRoot, {
      libraries: [
        "@lars-artmann/typespec-asyncapi",
        "@typespec/http",
        "@typespec/openapi3",
        "@typespec/versioning",
      ],
    }).emit("@typespec/openapi3", {});

    const [result, diagnostics] = await tester.compileAndDiagnose(fixture);
    expect(countByCode(diagnostics, "@typespec/http/duplicate-operation")).toBe(
      2,
    );
    expect(Object.keys(result.outputs)).toStrictEqual([]);
  });
});
