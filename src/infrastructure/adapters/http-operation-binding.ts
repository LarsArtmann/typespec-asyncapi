import type {
  Binding,
  SchemaObject,
} from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * HTTP Binding Types (from AsyncAPI HTTP Binding Specification v0.3.0)
 */
export type HttpOperationBinding = {
  type?: "request" | "response";
  method?: string;
  query?: SchemaObject;
} & Binding;
