/**
 * Document Structure Constraints
 *
 * Verifies the structural requirements that downstream tools (generators,
 * parsers, code generators) depend on when consuming AsyncAPI 3.1 documents:
 *
 * 1. info.title and info.version present (used for output file naming)
 * 2. All $ref pointers resolve to real targets (generator dereferences during rendering)
 * 3. Channels have addresses (used for output file paths)
 * 4. Messages have payload schemas (rendered into typed code)
 * 5. Operations have actions (determine template selection)
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";

type AsyncApiDoc = Record<string, unknown> | null;

async function compileAndGetDoc(source: string): Promise<NonNullable<AsyncApiDoc>> {
  const result = await compileAsyncAPI(source);
  if (!result.asyncApiDoc) {
    throw new Error("No output document produced");
  }
  return result.asyncApiDoc as NonNullable<AsyncApiDoc>;
}

function resolveRef(doc: NonNullable<AsyncApiDoc>, ref: string): unknown {
  if (!ref.startsWith("#/")) {
    return null;
  }
  const parts = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return current;
}

function collectAllRefs(obj: unknown, refs: string[] = []): string[] {
  if (!obj || typeof obj !== "object") {
    return refs;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectAllRefs(item, refs);
    }
    return refs;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === "string") {
    refs.push(record.$ref);
  }
  for (const value of Object.values(record)) {
    collectAllRefs(value, refs);
  }
  return refs;
}

describe("document structure constraints", () => {
  it("info.title and info.version are present for output file naming", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    const info = doc.info as Record<string, unknown> | undefined;
    expect(info).toBeDefined();
    expect(info!.title).toBeDefined();
    expect(info!.title).toBeTypeOf("string");
    expect(info!.version).toBeDefined();
    expect(info!.version).toBeTypeOf("string");
  });

  it("all $ref pointers resolve to real targets", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model Address { street: string; city: string; }
      model User { id: string; name: string; address: Address; }
      model Order { id: string; user: User; }
      @channel("orders")
      op publish(): Order;
    `);
    const refs = collectAllRefs(doc);
    expect(refs.length).toBeGreaterThan(0);

    for (const ref of refs) {
      const target = resolveRef(doc, ref);
      expect(target).toBeDefined();
      expect(target).not.toBeNull();
    }
  });

  it("channels have addresses for output file paths", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model Event { id: string; }
      @channel("users/events")
      op publish(): Event;
    `);
    const channels = doc.channels as Record<string, Record<string, unknown>> | undefined;
    expect(channels).toBeDefined();
    for (const channel of Object.values(channels!)) {
      expect(channel.address).toBeDefined();
      expect(channel.address).toBeTypeOf("string");
    }
  });

  it("messages have payload schemas for typed code generation", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model UserEvent { id: string; type: string; }
      @channel("users")
      op publish(): UserEvent;
    `);
    const components = doc.components as Record<string, Record<string, unknown>> | undefined;
    expect(components).toBeDefined();
    const messages = components!.messages as Record<string, Record<string, unknown>> | undefined;
    expect(messages).toBeDefined();
    for (const message of Object.values(messages!)) {
      expect(message.payload).toBeDefined();
    }
  });

  it("operations have action values for template selection", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model Event { id: string; }
      @channel("send-channel")
      op publish(): Event;
      @channel("receive-channel")
      op subscribe(): Event;
    `);
    const operations = doc.operations as Record<string, Record<string, unknown>> | undefined;
    expect(operations).toBeDefined();
    const opValues = Object.values(operations!);
    expect(opValues).toHaveLength(2);
    const actions = opValues.map((o) => o.action);
    expect(actions).toContain("send");
    expect(actions).toContain("receive");
  });

  it("schemas have type definitions for code rendering", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model UserEvent {
        id: string;
        count: int32;
        active: boolean;
        timestamp: utcDateTime;
      }
      @channel("events")
      op publish(): UserEvent;
    `);
    const components = doc.components as Record<string, Record<string, unknown>> | undefined;
    const schemas = components!.schemas as Record<string, Record<string, unknown>> | undefined;
    expect(schemas).toBeDefined();
    const userEvent = schemas!.UserEvent;
    expect(userEvent).toBeDefined();
    expect(userEvent!.type).toBe("object");
    expect(userEvent!.properties).toBeDefined();
  });

  it("servers have protocol and host for transport code generation", async () => {
    const doc = await compileAndGetDoc(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt",
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    const servers = doc.servers as Record<string, Record<string, unknown>> | undefined;
    expect(servers).toBeDefined();
    for (const server of Object.values(servers!)) {
      expect(server.protocol).toBeDefined();
      expect(server.host).toBeDefined();
    }
  });

  it("multi-message operations produce multiple message refs for the generator", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model CreatedEvent { id: string; }
      model DeletedEvent { id: string; }
      @channel("events")
      op multi(): CreatedEvent | DeletedEvent;
    `);
    const operations = doc.operations as Record<string, Record<string, unknown>> | undefined;
    const op = Object.values(operations!)[0]!;
    const messages = op.messages as unknown[];
    expect(messages).toHaveLength(2);

    for (const msg of messages) {
      const ref = (msg as Record<string, unknown>).$ref as string;
      expect(ref).toBeDefined();
      const target = resolveRef(doc, ref);
      expect(target).toBeDefined();
    }
  });
});
