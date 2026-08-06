/**
 * Shared re-exports for builder modules.
 *
 * Centralizes the cross-file imports that every builder needs:
 * `getDoc` from `@typespec/compiler`, the consolidated state type,
 * the builder function type and context, and the `nameOfType` helper.
 *
 * Builders then import from `./_imports.js` instead of repeating the same
 * 4-line import block across files.
 */
export { getDoc, getExamples, getSummary, serializeValueAsJson } from "@typespec/compiler";
export type { AsyncAPIConsolidatedState } from "../state.js";
export type { BuilderFn, DocumentBuildContext } from "./types.js";
export { nameOfType, withMessage } from "./types.js";
export { iterNamedTypes } from "./shared-utils.js";
