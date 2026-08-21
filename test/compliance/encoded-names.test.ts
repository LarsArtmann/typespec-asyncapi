/**
 * AsyncAPI 3.1.0 Spec Compliance: @encodedName
 *
 * The core TypeSpec decorator `@encodedName("application/json", "wire")`
 * renames properties on the wire. The schema emitter uses the encoded name
 * for `properties` keys, `required` entries, and `discriminator` values.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: @encodedName", () => {
  it("renames properties on the wire", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Certificate {
        @encodedName("application/json", "exp")
        expireAt: utcDateTime;
        subject: string;
      }
      op read(): Certificate;
    `);

    const props = doc.components!.schemas!.Certificate.properties!;
    expect(props.exp).toBeDefined();
    expect(props.expireAt).toBeUndefined();
    expect(props.subject).toBeDefined();
  });

  it("uses the wire name in required arrays", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Certificate {
        @encodedName("application/json", "exp")
        expireAt: utcDateTime;
      }
      op read(): Certificate;
    `);

    const required = doc.components!.schemas!.Certificate.required!;
    expect(required).toContain("exp");
    expect(required).not.toContain("expireAt");
  });

  it("renames properties in nested models", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Inner {
        @encodedName("application/json", "wireInner")
        tspInner: string;
      }
      model Outer {
        @encodedName("application/json", "wireOuter")
        tspOuter: Inner;
      }
      op read(): Outer;
    `);

    const outer = doc.components!.schemas!.Outer;
    expect(outer.properties!.wireOuter).toStrictEqual({
      $ref: "#/components/schemas/Inner",
    });
    const inner = doc.components!.schemas!.Inner;
    expect(inner.properties!.wireInner).toBeDefined();
    expect(inner.properties!.tspInner).toBeUndefined();
  });

  it("uses the wire name for the discriminator property", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @discriminator("kind")
      model Event {
        @encodedName("application/json", "type")
        kind: string;
      }
      model UserCreated extends Event {
        kind: "user.created";
      }
      op read(): UserCreated;
    `);

    const event = doc.components!.schemas!.Event;
    expect(event.discriminator).toBe("type");
    expect(event.required).toContain("type");
    const userCreated = doc.components!.schemas!.UserCreated;
    expect(userCreated.allOf).toStrictEqual([
      { $ref: "#/components/schemas/Event" },
    ]);
  });

  it("resolves subtype MIME types to their JSON encoding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Payload {
        @encodedName("application/json", "jsonName")
        @encodedName("application/xml", "xmlName")
        value: string;
      }
      op read(): Payload;
    `);

    const props = doc.components!.schemas!.Payload.properties!;
    expect(props.jsonName).toBeDefined();
    expect(props.xmlName).toBeUndefined();
  });
});
