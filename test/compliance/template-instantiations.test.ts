/**
 * AsyncAPI 3.1.0 Spec Compliance: Template Instantiations
 *
 * Template instantiations (`Page<User>`) must be declared under stable
 * argument-derived names (`PageUser`) — never as dangling `$ref`s to the
 * generic base name. Unspeakable instantiations inline instead.
 *
 * Naming rule (mirrors the asset-emitter's declarationName): base name
 * plus each argument's name with its first letter capitalized.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";

describe("spec Compliance: Template Instantiations", () => {
  it("declares Page<User> as PageUser with items $ref to User", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Page<T> { items: T[]; }
      model User { id: string; }
      model UserList { page: Page<User>; }
      op read(): UserList;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.PageUser).toBeDefined();
    expect(schemas.UserList.properties.page).toStrictEqual({
      $ref: "#/components/schemas/PageUser",
    });
    expect(schemas.PageUser.properties.items.items).toStrictEqual({
      $ref: "#/components/schemas/User",
    });
    expect(schemas.Page).toBeUndefined();
  });

  it("declares Page<string> as PageString with string items", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Page<T> { items: T[]; }
      model OrderList { page: Page<string>; }
      op read(): OrderList;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.PageString).toBeDefined();
    expect(schemas.PageString.properties.items.items).toStrictEqual({
      type: "string",
    });
  });

  it("capitalizes scalar argument names (int32 -> Int32)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Box<T> { value: T; }
      model Counters { box: Box<int32>; }
      op read(): Counters;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.BoxInt32).toBeDefined();
    expect(schemas.Counters.properties.box).toStrictEqual({
      $ref: "#/components/schemas/BoxInt32",
    });
  });

  it("resolves nested instantiations recursively (Page<Page<User>>)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Page<T> { items: T[]; }
      model User { id: string; }
      model Nested { page: Page<Page<User>>; }
      op read(): Nested;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.PagePageUser).toBeDefined();
    expect(schemas.PagePageUser.properties.items.items).toStrictEqual({
      $ref: "#/components/schemas/PageUser",
    });
    expect(schemas.PageUser).toBeDefined();
  });

  it("declares enum arguments with their name (Box<Status> -> BoxStatus)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Box<T> { value: T; }
      enum Status { active, paused }
      model Holder { box: Box<Status>; }
      op read(): Holder;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.BoxStatus).toBeDefined();
    expect(schemas.Status).toBeDefined();
    expect(schemas.BoxStatus.properties.value).toStrictEqual({
      $ref: "#/components/schemas/Status",
    });
  });

  it("declares direct op-return instantiations", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Page<T> { items: T[]; }
      model User { id: string; }
      op readUsers(): Page<User>;
    `);

    const schemas = doc.components!.schemas!;
    expect(schemas.PageUser).toBeDefined();
    const { payload } = doc.components!.messages!.PageUser as {
      payload?: unknown;
    };
    expect(payload).toStrictEqual({ $ref: "#/components/schemas/PageUser" });
  });

  it("inlines unspeakable instantiations instead of dangling refs", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Box<T> { value: T; }
      model Holder { box: Box<{ x: string; y: int32; }>; }
      op read(): Holder;
    `);

    const schemas = doc.components!.schemas!;
    expect(Object.keys(schemas)).toStrictEqual(["Holder"]);
    const inline = schemas.Holder.properties.box as Record<string, unknown>;
    expect(inline.$ref).toBeUndefined();
    expect(inline.type).toBe("object");
    const inlineValue = inline.properties.value as Record<string, unknown>;
    expect(inlineValue.properties).toHaveProperty("x");
  });

  it("warns on schema-name collisions between models and instantiations", async () => {
    const result = await compileAsyncAPISpecWithoutErrors(`
      namespace Test;
      model Page<T> { items: T[]; }
      model User { id: string; }
      model PageUser { note: string; }
      model Holder { page: Page<User>; }
      op read(): Holder;
    `);
    const collisions = result.diagnostics.filter(
      (d) => d.code === "@lars-artmann/typespec-asyncapi/duplicate-schema-name",
    );
    expect(collisions.length).toBeGreaterThan(0);
  });
});
