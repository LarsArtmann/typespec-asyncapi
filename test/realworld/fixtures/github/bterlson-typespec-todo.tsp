/**
 * Source: bterlson/typespec-todo (main.tsp, 277 lines)
 * Repo:   https://github.com/bterlson/typespec-todo
 * Author: Brian Terlson (creator of TypeSpec)
 *
 * STRIPPED: @typespec/http, @typespec/rest, @typespec/openapi3, @typespec/openapi,
 *           @typespec/json-schema imports; @route, @post, @query, @key, @error,
 *           @statusCode, @body decorators; namespace nesting; route aliases;
 *           @useAuth; @jsonSchema; @OpenAPI.extension
 *
 * KEPT (verbatim): All model definitions, property types, @visibility, @minLength,
 *                  @maxLength, @pattern, @minValue, @maxValue, unions, spread,
 *                  bytes type, model property refs (User.id), defaults
 */
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Todo App" })
@apiVersion("1.0.0")
@server("main", #{
  url: "todo.example.com",
  protocol: "https",
  description: "Todo API server"
})
namespace Todo;

model User {
  @visibility(Lifecycle.Read)
  id: safeint;

  @minLength(2)
  @maxLength(50)
  username: string;

  email: string;

  @visibility(Lifecycle.Create)
  password: string;

  @visibility(Lifecycle.Read)
  validated: boolean;
}

model TodoItem {
  @visibility(Lifecycle.Read)
  id: safeint;

  @maxLength(255)
  title: string;

  @visibility(Lifecycle.Read)
  createdBy: User.id;

  assignedTo?: User.id;

  description?: string;

  status: "NotStarted" | "InProgress" | "Completed";

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  @visibility(Lifecycle.Read)
  updatedAt: utcDateTime;

  @visibility(Lifecycle.Read)
  completedAt?: utcDateTime;

  labels?: TodoLabels;
}

union TodoLabels {
  string,
  string[],
  TodoLabelRecord,
  TodoLabelRecord[],
}

model TodoLabelRecord {
  name: string;

  @pattern("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
  color?: string;
}

union TodoAttachment {
  file: TodoFileAttachment,
  url: TodoUrlAttachment,
}

model TodoUrlAttachment {
  description: string;
  url: url;
}

model TodoFileAttachment {
  @maxLength(255)
  filename: string;

  mediaType: string;

  contents: bytes;
}

model ApiError {
  code: string;
  message: string;
}

model Standard4XXResponse extends ApiError {
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
}

model Standard5XXResponse extends ApiError {
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
}

model PaginationControls {
  limit?: int32 = 50;
  offset?: int32 = 0;
}

@channel("todo.items.created")
@publish
op publishTodoItemCreated(payload: TodoItem): void;

@channel("todo.items.updated")
@publish
op publishTodoItemUpdated(payload: TodoItem): void;

@channel("todo.errors.4xx")
@publish
op publishClientError(payload: Standard4XXResponse): void;

@channel("todo.errors.5xx")
@publish
op publishServerError(payload: Standard5XXResponse): void;

@channel("todo.attachments.uploaded")
@publish
op publishAttachmentUploaded(payload: TodoFileAttachment): void;
