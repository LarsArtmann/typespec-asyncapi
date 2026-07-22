/**
 * Operation Builder
 *
 * Builds AsyncAPI operation objects from discovered operations,
 * applying tags, bindings, and @doc descriptions.
 */

import { getDoc } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type { OperationObject } from "../domain/models/asyncapi-document.js";
import { refChannel } from "../domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./types.js";
import { nameOfType } from "./types.js";
import {
  buildOperationMessageRef,
  registerMessage,
} from "./channel-builder.js";

/** Build all operations from discovered ops, applying decorators. */
export function buildOperations(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const op of ctx.discoveredOps) {
    registerMessage(ctx, op.messageName, op.channelKey);

    const operationObj: OperationObject = {
      action: op.action,
      channel: refChannel(op.channelKey),
      messages: [buildOperationMessageRef(op.channelKey, op.messageName)],
    };

    const opType = [
      ...state.operations.keys(),
      ...state.channels.keys(),
    ].find((t) => nameOfType(t) === op.opName);
    if (opType) {
      const doc = getDoc(ctx.program, opType);
      if (doc) {
        ctx.opDocs.set(op.opName, doc);
      }

      const tags = state.tags.get(opType);
      if (tags && tags.length > 0) {
        operationObj.tags = tags;
      }

      const bindings = state.protocolBindings.get(opType);
      if (bindings && Object.keys(bindings).length > 0) {
        operationObj.bindings = bindings;
      }
    }

    ctx.operations[op.opName] = operationObj;
  }

  applyOperationDocs(ctx);
}

/** Apply @doc descriptions to operations from the opDocs map. */
function applyOperationDocs(ctx: DocumentBuildContext): void {
  for (const [opName, doc] of ctx.opDocs) {
    const op = ctx.operations[opName];
    if (op && !op.description) {
      op.description = doc;
    }
  }
}
