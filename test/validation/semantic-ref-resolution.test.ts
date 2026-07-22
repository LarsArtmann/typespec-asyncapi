/**
 * Semantic Validation: $ref Resolution & Document Coherence
 *
 * The @asyncapi/parser package (v3.6.0) has a Bun incompatibility in its
 * internal AJV code generation (new Function() fails under Bun's runtime).
 * This test provides the most critical semantic check the parser performs:
 * resolving every $ref in the document to ensure it points to an existing
 * definition, and verifying operation/channel/message coherence.
 *
 * Checks performed:
 * 1. Every $ref in the document resolves to an actual target
 * 2. Operations reference channels that exist
 * 3. Channel messages reference component messages that exist
 * 4. Component message payloads reference schemas that exist
 * 5. No dangling references anywhere in the document
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const examplesRoot = join(import.meta.dirname, "..", "..", "examples");

function findTspFiles(
  dir: string,
  acc: { name: string; path: string }[] = [],
): { name: string; path: string }[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findTspFiles(fullPath, acc);
    } else if (entry.endsWith(".tsp")) {
      const relative = fullPath.replace(examplesRoot + "/", "").replace(/\.tsp$/, "");
      acc.push({ name: relative, path: fullPath });
    }
  }
  return acc;
}

const exampleFiles = findTspFiles(examplesRoot);

/** Resolve a JSON Pointer $ref against a document, return true if it exists. */
function refExists(doc: unknown, ref: string): boolean {
  if (!ref.startsWith("#/")) return false;
  const parts = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return false;
    const decoded = part.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[decoded];
    if (current === undefined) return false;
  }
  return true;
}

/** Recursively find all $ref strings in a document. */
function findAllRefs(obj: unknown, refs: string[] = []): string[] {
  if (obj == null || typeof obj !== "object") return refs;
  if (Array.isArray(obj)) {
    for (const item of obj) findAllRefs(item, refs);
    return refs;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === "string") {
    refs.push(record.$ref);
  }
  for (const value of Object.values(record)) {
    findAllRefs(value, refs);
  }
  return refs;
}

/** Unescape a JSON Pointer reference token (RFC 6901). */
function unescapeRefToken(token: string): string {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

describe("Semantic Validation: $ref Resolution", () => {
  for (const file of exampleFiles) {
    const source = readFileSync(file.path, "utf-8");

    it(`all $refs resolve for: ${file.name}`, async () => {
      const result = await compileAsyncAPI(source);
      const doc = result.asyncApiDoc;

      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors).toEqual([]);
      expect(doc).toBeTruthy();

      const allRefs = findAllRefs(doc);
      expect(allRefs.length).toBeGreaterThan(0);

      const dangling = allRefs.filter((ref) => !refExists(doc, ref));
      if (dangling.length > 0) {
        console.error(`Dangling $refs in ${file.name}:`, dangling);
      }
      expect(dangling).toEqual([]);
    });

    it(`operation → channel → message chain is coherent for: ${file.name}`, async () => {
      const result = await compileAsyncAPI(source);
      const doc = result.asyncApiDoc as Record<string, any>;
      expect(doc).toBeTruthy();

      const channels = doc.channels ?? {};
      const operations = doc.operations ?? {};
      const componentMessages = doc.components?.messages ?? {};
      const componentSchemas = doc.components?.schemas ?? {};

      for (const [opName, op] of Object.entries<any>(operations)) {
        // Operation must reference a channel
        const channelRef = op?.channel?.$ref;
        expect(channelRef).toMatch(/^#\/channels\//);

        // Channel must exist
        const channelId = unescapeRefToken(channelRef.replace("#/channels/", ""));
        expect(channels[channelId]).toBeDefined();

        // Operation messages must reference channel messages
        for (const msg of op?.messages ?? []) {
          expect(msg?.$ref).toBeDefined();
          expect(msg?.$ref.startsWith(channelRef + "/messages/")).toBe(true);
        }
      }

      // Channel messages must reference component messages
      for (const [, channel] of Object.entries<any>(channels)) {
        for (const [, msgRef] of Object.entries<any>(channel?.messages ?? {})) {
          expect(msgRef?.$ref).toMatch(/^#\/components\/messages\//);
          const msgId = unescapeRefToken(msgRef.$ref.replace("#/components/messages/", ""));
          expect(componentMessages[msgId]).toBeDefined();
        }
      }

      // Component message payloads must reference schemas
      for (const [, msg] of Object.entries<any>(componentMessages)) {
        const payloadRef = msg?.payload?.$ref;
        if (payloadRef) {
          expect(payloadRef).toMatch(/^#\/components\/schemas\//);
          const schemaId = unescapeRefToken(payloadRef.replace("#/components/schemas/", ""));
          expect(componentSchemas[schemaId]).toBeDefined();
        }
      }
    });
  }
});
