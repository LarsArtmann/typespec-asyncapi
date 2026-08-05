/**
 * AsyncAPI 3.1.0 Spec Compliance: Info Object Fields
 *
 * Verifies that emitter options for contact, license, termsOfService,
 * and externalDocs produce valid AsyncAPI 3.1 output.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

const baseSpec = `
  namespace Test;
  model Event { id: string; }
  @channel("events")
  op publish(): Event;
`;

describe("spec Compliance: Info Object Fields", () => {
  it("emits info.contact from emitter options", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec, {
      contact: { name: "API Team", email: "api@test.com", url: "https://test.com" },
    });
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.contact).toStrictEqual({
      name: "API Team",
      email: "api@test.com",
      url: "https://test.com",
    });
  });

  it("emits info.license from emitter options", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec, {
      license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    });
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.license).toStrictEqual({ name: "MIT", url: "https://opensource.org/licenses/MIT" });
  });

  it("emits info.termsOfService from emitter options", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec, {
      termsOfService: "https://test.com/terms",
    });
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.termsOfService).toBe("https://test.com/terms");
  });

  it("emits info.externalDocs from emitter options", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec, {
      externalDocs: { url: "https://docs.test.com", description: "Full documentation" },
    });
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.externalDocs).toStrictEqual({
      url: "https://docs.test.com",
      description: "Full documentation",
    });
  });

  it("does not emit optional info fields when not provided", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec);
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.contact).toBeUndefined();
    expect(info.license).toBeUndefined();
    expect(info.termsOfService).toBeUndefined();
    expect(info.externalDocs).toBeUndefined();
  });

  it("emits all info fields simultaneously", async () => {
    const doc = await compileAndValidateOrThrow(baseSpec, {
      contact: { name: "Dev Team" },
      license: { name: "Apache-2.0" },
      termsOfService: "https://test.com/tos",
      externalDocs: { url: "https://wiki.test.com" },
      description: "A test API",
    });
    const { info } = doc as ParsedAsyncAPIDocument;
    expect(info.description).toBe("A test API");
    expect(info.contact?.name).toBe("Dev Team");
    expect(info.license?.name).toBe("Apache-2.0");
    expect(info.termsOfService).toBe("https://test.com/tos");
    expect(info.externalDocs?.url).toBe("https://wiki.test.com");
  });
});
