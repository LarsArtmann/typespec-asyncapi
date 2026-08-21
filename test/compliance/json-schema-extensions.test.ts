/**
 * AsyncAPI 3.1.0 Spec Compliance: @jsonSchemaExtension
 *
 * `@jsonSchemaExtension(key, value)` attaches arbitrary JSON Schema
 * keywords to schemas. Works on Model, ModelProperty, Union, Enum, and
 * Scalar declarations; repeatable with merge semantics (same key: last
 * wins); applied inline AND as a `$ref` sibling (mirroring the metadata
 * policy — AJV accepts unknown keywords in AsyncAPI 3.1 schema objects).
 */

import { compileAndValidate, compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: @jsonSchemaExtension", () => {
  it("applies extensions to a model declaration", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @jsonSchemaExtension("x-team", "payments")
      @jsonSchemaExtension("multipleOf", 5)
      model Amount { value: int32; }
      op read(): Amount;
    `);

    const amount = doc.components!.schemas!.Amount;
    expect(amount["x-team"]).toBe("payments");
    expect(amount["multipleOf"]).toBe(5);
  });

  it("applies extensions to model properties inline", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model User {
        @jsonSchemaExtension("x-pii", true)
        email: string;
      }
      op read(): User;
    `);

    const { email } = doc.components!.schemas!.User.properties!;
    const { type } = email;
    expect(email["x-pii"]).toBe(true);
    expect(type).toBe("string");
  });

  it("is repeatable with merge semantics (outermost same-key entry wins)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model User {
        @jsonSchemaExtension("x-order", "outermost")
        @jsonSchemaExtension("x-other", 1)
        @jsonSchemaExtension("x-order", "innermost")
        email: string;
      }
      op read(): User;
    `);

    const { email } = doc.components!.schemas!.User.properties!;
    expect(email["x-order"]).toBe("outermost");
    expect(email["x-other"]).toBe(1);
  });

  it("applies extensions as $ref siblings on named-type properties", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Address { street: string; }
      model User {
        @jsonSchemaExtension("x-required-for", "shipping")
        home: Address;
      }
      op read(): User;
    `);

    const email = doc.components!.schemas!.User.properties!.home;
    const { $ref } = email;
    expect($ref).toBe("#/components/schemas/Address");
    expect(email["x-required-for"]).toBe("shipping");
  });

  it("applies extensions to enum, union, and scalar declarations", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @jsonSchemaExtension("x-enum-tag", "status")
      enum Status { active, paused }
      @jsonSchemaExtension("x-union-tag", "result")
      union Result { ok: string, err: string }
      @jsonSchemaExtension("x-scalar-tag", "id")
      scalar UserId extends string;
      model Holder { a: Status, b: Result, c: UserId; }
      op read(): Holder;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.Status["x-enum-tag"]).toBe("status");
    expect(schemas.Result["x-union-tag"]).toBe("result");
    expect(schemas.UserId["x-scalar-tag"]).toBe("id");
  });

  it("supports object and array values", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @jsonSchemaExtension("x-metadata", #{ owner: "platform", tier: 2 })
      @jsonSchemaExtension("x-aliases", #["AmountV1", "AmountV2"])
      model Amount { value: int32; }
      op read(): Amount;
    `);

    const amount = doc.components!.schemas!.Amount;
    expect(amount["x-metadata"]).toStrictEqual({ owner: "platform", tier: 2 });
    expect(amount["x-aliases"]).toStrictEqual(["AmountV1", "AmountV2"]);
  });

  it("warns on invalid keys and skips the extension", async () => {
    const result = await compileAndValidate(`
      namespace Test;
      model User {
        @jsonSchemaExtension("has space", true)
        @jsonSchemaExtension("", true)
        email: string;
      }
      op read(): User;
    `);
    expect(result.valid).toBe(true);

    const invalid = result.diagnostics.filter(
      (d) =>
        d.code ===
        "@lars-artmann/typespec-asyncapi/invalid-json-schema-extension-key",
    );
    expect(invalid).toHaveLength(2);

    const { email } = result.document.components!.schemas!.User.properties!;
    expect(email["has space"]).toBeUndefined();
    expect(email[""]).toBeUndefined();
    const { type } = email;
    expect(type).toBe("string");
  });
});
