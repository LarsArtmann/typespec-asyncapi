/**
 * AsyncAPI 3.1.0 Spec Compliance: Operation Reply
 *
 * Validates that @reply decorator produces valid operation reply objects
 * that conform to the AsyncAPI 3.1.0 specification.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: Operation Reply", () => {
  it("emits reply with message reference", async () => {
    const doc = await compileAndValidateOrThrow(`
      model Request { id: string; }
      model Response { status: string; }

      @channel("requests")
      @publish
      @reply(Response)
      op sendRequest(): Request;
    `);

    const op = doc.operations?.sendRequest as Record<string, unknown> | undefined;
    expect(op).toBeDefined();
    const reply = op?.reply as Record<string, unknown> | undefined;
    expect(reply).toBeDefined();
    const messages = reply?.messages as { $ref: string }[] | undefined;
    expect(messages).toBeDefined();
    expect(messages).toHaveLength(1);
    expect(messages?.[0].$ref).toContain("Response");
  });

  it("emits reply with address when provided", async () => {
    const doc = await compileAndValidateOrThrow(`
      model Request { id: string; }
      model Response { status: string; }

      @channel("requests")
      @publish
      @reply(Response, "$message.header#/replyTo")
      op sendRequest(): Request;
    `);

    const op = doc.operations?.sendRequest as Record<string, unknown> | undefined;
    const reply = op?.reply as Record<string, unknown> | undefined;
    const address = reply?.address as Record<string, unknown> | undefined;
    expect(address).toBeDefined();
    expect(address?.location).toBe("$message.header#/replyTo");
  });

  it("registers reply message in components.messages", async () => {
    const doc = await compileAndValidateOrThrow(`
      model Request { id: string; }
      model Response { status: string; }

      @channel("requests")
      @publish
      @reply(Response)
      op sendRequest(): Request;
    `);

    const messages = doc.components?.messages as Record<string, unknown> | undefined;
    expect(messages?.Response).toBeDefined();
  });

  it("registers reply message schema in components.schemas", async () => {
    const doc = await compileAndValidateOrThrow(`
      model Request { id: string; }
      model Response { status: string; }

      @channel("requests")
      @publish
      @reply(Response)
      op sendRequest(): Request;
    `);

    const schemas = doc.components?.schemas as Record<string, unknown> | undefined;
    expect(schemas?.Response).toBeDefined();
  });
});
