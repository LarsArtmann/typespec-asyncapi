/**
 * Domain: `@protocol` on Model targets
 *
 * Models map to messages, so `@protocol` on a Model routes to the model's
 * message bindings: the `binding:` passthrough becomes the message binding
 * (with `bindingVersion` auto-injected). Channel/operation-only config
 * fields (e.g. kafka `partitions`) cannot attach to a message and must
 * produce the `protocol-model-fields-unplaced` warning instead of being
 * silently dropped.
 */

import { inlineObject } from "../utils/type-guards.js";
import {
  compileAndValidate,
  validateAsyncAPIDocument,
} from "../utils/schema-validator.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";

describe("domain: @protocol on Model routes to message bindings", () => {
  it("places the binding passthrough on the model's message with bindingVersion", async () => {
    const {
      document: doc,
      diagnostics,
      valid,
    } = await compileAndValidate(`
      namespace Test;
      @protocol(#{
        protocol: "kafka",
        binding: #{ key: #{ type: "string" } },
      })
      model OrderEvent { orderId: string; }
      @channel("orders")
      op place(): OrderEvent;
    `);

    expect(diagnostics).toHaveLength(0);
    expect(valid).toBe(true);
    const msg = inlineObject(
      doc.components!.messages!["OrderEvent"],
      "message",
    );
    const bindings = inlineObject(msg.bindings, "message bindings");
    const kafka = inlineObject(bindings.kafka, "kafka binding");
    expect(kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
    expect(kafka.key).toStrictEqual({ type: "string" });
  });

  it("warns on channel-only fields (kafka partitions) instead of dropping them", async () => {
    const { document: doc, diagnostics } = await compileAndValidate(`
      namespace Test;
      @protocol(#{
        protocol: "kafka",
        partitions: 3,
      })
      model OrderEvent { orderId: string; }
      @channel("orders")
      op place(): OrderEvent;
    `);

    const warning = diagnostics.find((d) =>
      d.code?.endsWith("protocol-model-fields-unplaced"),
    );
    expect(warning).toBeDefined();
    expect(warning?.message).toContain("partitions");
    for (const channel of Object.values(doc.channels!)) {
      expect(channel.bindings).toBeUndefined();
    }
  });

  it("warns when the protocol has no message binding (ws)", async () => {
    const { document: doc, diagnostics } = await compileAndValidate(`
      namespace Test;
      @protocol(#{
        protocol: "ws",
        binding: #{ maxPayload: 1024 },
      })
      model ChatMessage { text: string; }
      @channel("chat")
      op send(): ChatMessage;
    `);

    const warning = diagnostics.find((d) =>
      d.code?.endsWith("protocol-model-fields-unplaced"),
    );
    expect(warning).toBeDefined();
    expect(warning?.message).toContain("maxPayload");
    const msg = inlineObject(
      doc.components!.messages!["ChatMessage"],
      "message",
    );
    expect(msg.bindings).toBeUndefined();
  });

  it("reports no-message when the model is never used by an operation", async () => {
    const { diagnostics } = await compileAndValidate(`
      namespace Test;
      @protocol(#{
        protocol: "kafka",
        binding: #{ key: #{ type: "string" } },
      })
      model OrphanPayload { id: string; }
      @channel("orders")
      op ping(): void;
    `);

    const warning = diagnostics.find((d) =>
      d.code?.endsWith("protocol-model-fields-unplaced"),
    );
    expect(warning).toBeDefined();
    expect(warning?.message).toContain("OrphanPayload");
  });

  it("merges with @bindings output, explicit fields winning", async () => {
    const {
      document: doc,
      diagnostics,
      valid,
    } = await compileAndValidate(`
      namespace Test;
      @bindings(#{ kafka: #{ schemaIdLocation: "header" } })
      @protocol(#{
        protocol: "kafka",
        binding: #{ schemaIdPayloadEncoding: "wire" },
      })
      model OrderEvent { orderId: string; }
      @channel("orders")
      op place(): OrderEvent;
    `);

    expect(diagnostics).toHaveLength(0);
    expect(valid).toBe(true);
    validateAsyncAPIDocument(doc);
    const msg = inlineObject(
      doc.components!.messages!["OrderEvent"],
      "message",
    );
    const bindings = inlineObject(msg.bindings, "message bindings");
    const kafka = inlineObject(bindings.kafka, "kafka binding");
    expect(kafka.schemaIdLocation).toBe("header");
    expect(kafka.schemaIdPayloadEncoding).toBe("wire");
  });
});
