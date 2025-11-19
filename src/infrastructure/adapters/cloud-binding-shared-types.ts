/**
 * Shared type imports for cloud binding plugins
 * Eliminates import duplication across cloud-binding-plugin.ts and cloud-binding-plugin-registry.ts
 */
export type { Effect } from "effect";
export type { DecoratorContext, Model, Operation } from "@typespec/compiler";
export type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
export type { CloudBindingResult } from "./cloud-binding-result.js";
