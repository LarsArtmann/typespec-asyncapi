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

    const op = doc.operations?.sendRequest;
    expect(op).toBeDefined();
    const reply = op?.reply;
    expect(reply).toBeDefined();
    expect(reply?.messages).toBeDefined();
    expect(reply?.messages).toHaveLength(1);
    expect(reply?.messages?.[0].$ref).toContain("Response");
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

    const reply = doc.operations?.sendRequest?.reply;
    expect(reply?.address).toBeDefined();
    expect(reply?.address).toHaveProperty(
      "location",
      "$message.header#/replyTo",
    );
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

    expect(doc.components?.messages?.Response).toBeDefined();
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

    expect(doc.components?.schemas?.Response).toBeDefined();
  });
});
