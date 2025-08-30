/**
 * JSON Schema Object definition for AsyncAPI specifications
 * Shared across multiple emitter components
 */
export type SchemaObject = {
  type?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  not?: SchemaObject;
  additionalProperties?: boolean | SchemaObject;
  default?: unknown;
  example?: unknown;
  examples?: unknown[];
  title?: string;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
};