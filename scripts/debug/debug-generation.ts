#!/usr/bin/env bun
/**
 * Debug script to understand what's happening with AsyncAPI generation
 */

import {
  createAsyncAPITestHost,
  compileAndGetAsyncAPI,
} from "./test/utils/test-helpers.js";

async function debugGeneration() {
  console.log("🔍 DEBUG: Starting AsyncAPI generation debug");

  const host = await createAsyncAPITestHost();
  host.addTypeSpecFile(
    "debug.tsp",
    `
    import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace DebugTest;

      model Msg { data: string; }

      @channel("test")
      @publish
      op publishMessage(): Msg;
  `,
  );

  console.log("🔍 DEBUG: TypeSpec file added");

  const spec = await compileAndGetAsyncAPI(host, "./debug.tsp");

  console.log("🔍 DEBUG: Generation complete");
  console.log("🔍 DEBUG: Spec type:", typeof spec);
  console.log("🔍 DEBUG: Spec null?", spec === null);
  console.log("🔍 DEBUG: Spec keys:", spec ? Object.keys(spec) : "N/A");
  console.log("🔍 DEBUG: asyncapi field:", spec?.asyncapi);
  console.log("🔍 DEBUG: Full spec:", JSON.stringify(spec, null, 2));
}

debugGeneration().catch(console.error);
