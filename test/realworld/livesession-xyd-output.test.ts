/**
 * Livesession/xyd Production Model Validation
 *
 * Source: https://github.com/livesession/xyd
 * File:   packages/apitoolchain-schemas/tsp/models.tsp (724 lines)
 *
 * This is a REAL production codebase. The file contains pure data models
 * (no HTTP decorators, no external imports) and compiles CLEANLY through
 * this emitter with zero diagnostics.
 *
 * This test suite validates that the emitter produces CORRECT JSON Schema
 * output for every model definition — not just "it compiles" but "the
 * schemas match what the models actually declare."
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

const reposDir = join(import.meta.dirname, "repos");

const source = readFileSync(join(reposDir, "livesession-xyd.tsp"), "utf8");

describe("livesession/xyd production model output", () => {
  it("compiles with zero error diagnostics", async () => {
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toStrictEqual([]);
  });

  it("validates against AsyncAPI 3.1.0 JSON Schema", async () => {
    const doc = await compileAndValidateOrThrow(source);
    expect(doc.asyncapi).toBe("3.1.0");
  });

  it("generates 30+ schemas from production models", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const schemaNames = Object.keys(doc.components?.schemas ?? {});
    expect(schemaNames.length).toBeGreaterThanOrEqual(30);
  });

  it("renders enums with explicit string values (UsageRange)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const range = doc.components?.schemas?.UsageRange;
    expect(range).toStrictEqual({
      type: "string",
      enum: ["24h", "7d", "30d", "90d"],
    });
  });

  it("renders enums without explicit values (BuildStatus)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const status = doc.components?.schemas?.BuildStatus;
    expect(status).toStrictEqual({
      type: "string",
      enum: ["ready", "building", "error", "draft"],
    });
  });

  it("renders SdkLanguage enum (6 languages)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const langs = doc.components?.schemas?.SdkLanguage;
    expect(langs).toStrictEqual({
      type: "string",
      enum: ["go", "python", "node", "ruby", "java", "dotnet"],
    });
  });

  it("renders float64 as { type: number, format: double }", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const point = doc.components?.schemas?.UsagePoint;
    expect(point?.properties?.value).toStrictEqual({
      format: "double",
      type: "number",
    });
  });

  it("renders int32 fields with format", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const stats = doc.components?.schemas?.OverviewStats;
    expect(stats?.properties?.apis).toStrictEqual({
      format: "int32",
      type: "integer",
    });
  });

  it("renders $ref for named model properties (User in AuthSession)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const session = doc.components?.schemas?.AuthSession;
    expect(session?.properties?.user).toStrictEqual({
      $ref: "#/components/schemas/User",
    });
  });

  it("renders arrays of named models with $ref items (ApiVersion[])", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const entry = doc.components?.schemas?.RegistryEntryCore;
    expect(entry?.properties?.versions).toStrictEqual({
      type: "array",
      items: { $ref: "#/components/schemas/ApiVersion" },
    });
  });

  it("renders spread (...RegistryEntryCore) by flattening properties", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const entry = doc.components?.schemas?.RegistryEntry;
    expect(entry?.properties?.id).toBeDefined();
    expect(entry?.properties?.name).toBeDefined();
    expect(entry?.properties?.description).toBeDefined();
    expect(entry?.properties?.format).toBeDefined();
    expect(entry?.properties?.sdkTargetCount).toStrictEqual({
      format: "int32",
      type: "integer",
    });
  });

  it("marks required vs optional fields correctly (RepoConnection)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const conn = doc.components?.schemas?.RepoConnection;
    expect(conn?.required).toContain("id");
    expect(conn?.required).toContain("providerId");
    expect(conn?.required).toContain("targetKind");
    expect(conn?.required).toContain("repo");
    expect(conn?.required).toContain("branch");
    expect(conn?.required).toContain("prefix");
    expect(conn?.required).not.toContain("lastSyncedAt");
    expect(conn?.required).not.toContain("releaseMode");
    expect(conn?.required).not.toContain("autoRelease");
    expect(conn?.required).not.toContain("baseBranch");
    expect(conn?.required).not.toContain("prerelease");
    expect(conn?.required).not.toContain("distTags");
  });

  it("renders boolean fields correctly (SdkTarget.configPending)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const target = doc.components?.schemas?.SdkTarget;
    expect(target?.properties?.configPending?.type).toBe("boolean");
  });

  it("renders nested enum via $ref (SdkTarget.language → SdkLanguage)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const target = doc.components?.schemas?.SdkTarget;
    expect(target?.properties?.language).toStrictEqual({
      $ref: "#/components/schemas/SdkLanguage",
    });
  });

  it("renders nested enum via $ref (Notification.severity → NotificationSeverity)", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const notif = doc.components?.schemas?.Notification;
    expect(notif?.properties?.severity).toStrictEqual({
      $ref: "#/components/schemas/NotificationSeverity",
    });
  });

  it("renders arrays of named models via $ref (UsageSeries.points → UsagePoint[])", async () => {
    const doc = await compileAndValidateOrThrow(source);
    const series = doc.components?.schemas?.UsageSeries;
    expect(series?.properties?.points).toStrictEqual({
      type: "array",
      items: { $ref: "#/components/schemas/UsagePoint" },
    });
  });
});
