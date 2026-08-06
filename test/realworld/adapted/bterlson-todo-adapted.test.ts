/**
 * Adapted fixture: bterlson/typespec-todo → AsyncAPI
 *
 * Source: https://github.com/bterlson/typespec-todo (10⭐, TypeSpec creator's sample)
 *
 * The original repo is an HTTP REST API using @typespec/http. This adapted
 * fixture extracts the REAL MODELS verbatim and wraps them in AsyncAPI
 * channel/publish operations to test schema generation against real-world
 * TypeSpec patterns:
 *
 * - @key + @visibility decorators
 * - safeint scalar
 * - @minLength / @maxLength constraints
 * - Property references (User.id)
 * - Union string literal types ("NotStarted" | "InProgress" | "Completed")
 * - Optional properties
 * - utcDateTime
 *
 * Adaptations (documented):
 * 1. Replaced `import "@typespec/http"` with `import "@lars-artmann/typespec-asyncapi"`
 * 2. Wrapped models in a namespace with `@channel` / `@publish` operations
 * 3. Changed `@visibility("read")` to `@visibility(Lifecycle.Read)` (TypeSpec v1.14 breaking change)
 * 4. Removed `@service({title:...})` model-expression syntax (uses `#{}` instead)
 * 5. Removed `@jsonSchema` and `@key` decorators (not AsyncAPI-specific)
 * 6. Removed `@useAuth` (HTTP-specific)
 */

import { compileAsyncAPI } from "../../utils/test-helpers.js";

describe("adapted: bterlson/typespec-todo", () => {
  const source = `
    import "@lars-artmann/typespec-asyncapi";
    using TypeSpec.AsyncAPI;

    namespace TodoApi;

    model User {
      @visibility(Lifecycle.Read)
      id: safeint;

      @minLength(2)
      @maxLength(50)
      username: string;

      email: string;

      @visibility(Lifecycle.Create)
      password: string;
    }

    model TodoItem {
      @visibility(Lifecycle.Read) id: safeint;

      @maxLength(255)
      title: string;

      @visibility(Lifecycle.Read) createdBy: User.id;
      assignedTo?: User.id;
      description?: string;

      status: "NotStarted" | "InProgress" | "Completed";

      @visibility(Lifecycle.Read) createdAt: utcDateTime;
      @visibility(Lifecycle.Read) updatedAt: utcDateTime;
      @visibility(Lifecycle.Read) completedAt?: utcDateTime;
    }

    @channel("todos.created")
    @publish
    op publishTodo(): TodoItem;

    @channel("users.created")
    @publish
    op publishUser(): User;
  `;

  it("compiles without errors", async () => {
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("emits User schema with minLength/maxLength on username", async () => {
    const result = await compileAsyncAPI(source);
    const user = result.asyncApiDoc?.components?.schemas?.User;
    expect(user?.properties?.username).toMatchObject({
      type: "string",
      minLength: 2,
      maxLength: 50,
    });
  });

  it("emits safeint as integer with safeint format", async () => {
    const result = await compileAsyncAPI(source);
    const user = result.asyncApiDoc?.components?.schemas?.User;
    expect(user?.properties?.id).toMatchObject({
      type: "integer",
      format: "safeint",
    });
  });

  it("emits visibility as readOnly for Lifecycle.Read", async () => {
    const result = await compileAsyncAPI(source);
    const user = result.asyncApiDoc?.components?.schemas?.User;
    expect(user?.properties?.id).toMatchObject({ readOnly: true });
  });

  it("emits visibility as writeOnly for Lifecycle.Create", async () => {
    const result = await compileAsyncAPI(source);
    const user = result.asyncApiDoc?.components?.schemas?.User;
    expect(user?.properties?.password).toMatchObject({ writeOnly: true });
  });

  it("resolves User.id property reference to safeint", async () => {
    const result = await compileAsyncAPI(source);
    const todo = result.asyncApiDoc?.components?.schemas?.TodoItem;
    expect(todo?.properties?.createdBy).toMatchObject({
      type: "integer",
      format: "safeint",
    });
  });

  it("emits string-literal union as enum", async () => {
    const result = await compileAsyncAPI(source);
    const todo = result.asyncApiDoc?.components?.schemas?.TodoItem;
    expect(todo?.properties?.status).toMatchObject({
      type: "string",
      enum: ["NotStarted", "InProgress", "Completed"],
    });
  });

  it("emits optional properties as non-required", async () => {
    const result = await compileAsyncAPI(source);
    const todo = result.asyncApiDoc?.components?.schemas?.TodoItem;
    expect(todo?.required).not.toContain("description");
    expect(todo?.required).not.toContain("assignedTo");
    expect(todo?.required).toContain("title");
    expect(todo?.required).toContain("status");
  });

  it("produces valid operations and channels", async () => {
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc?.channels?.["todos.created"]).toBeDefined();
    expect(result.asyncApiDoc?.channels?.["users.created"]).toBeDefined();
    expect(result.asyncApiDoc?.operations?.publishTodo).toBeDefined();
    expect(result.asyncApiDoc?.operations?.publishUser).toBeDefined();
  });
});
