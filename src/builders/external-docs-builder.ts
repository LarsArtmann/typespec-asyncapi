/**
 * External Docs Builder
 *
 * Applies `@externalDocs` state to operations, messages, and the document info
 * object. The decorator targets Model (message), Operation, or Namespace
 * (document root); object-level values win over wider targets.
 */

import type { ExternalDocumentationObject } from "../domain/models/asyncapi-document.js";
import { nameOfType, withMessage } from "./types.js";
import type { BuilderFn } from "./types.js";

function toExternalDocs(data: {
  url: string;
  description?: string;
}): ExternalDocumentationObject {
  return data.description
    ? { url: data.url, description: data.description }
    : { url: data.url };
}

/** Apply @externalDocs state to operations, messages, and the document root. */
export const applyExternalDocs: BuilderFn = (state, ctx) => {
  for (const [type, data] of state.externalDocs) {
    const value = toExternalDocs(data);
    if (type.kind === "Operation") {
      const opName = nameOfType(type);
      const op = opName ? ctx.operations[opName] : undefined;
      if (op && op.externalDocs === undefined) {
        op.externalDocs = value;
      }
    } else if (type.kind === "Model") {
      const modelName = nameOfType(type);
      const hasMessage = modelName !== undefined && modelName in ctx.messages;
      if (modelName && hasMessage) {
        withMessage(ctx, modelName, (msg) => {
          if (msg.externalDocs === undefined) {
            msg.externalDocs = value;
          }
        });
      }
    } else if (type.kind === "Namespace" && !ctx.infoExternalDocs) {
      ctx.infoExternalDocs = value;
    }
  }
};
