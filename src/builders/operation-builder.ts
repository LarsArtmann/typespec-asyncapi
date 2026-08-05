/**
 * Operation Builder
 *
 * Builds AsyncAPI operation objects from discovered operations,
 * applying tags, bindings, and @doc descriptions.
 */

import { getDoc } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type {
  OperationObject,
  OperationReply,
} from "../domain/models/asyncapi-document.js";
import {
  escapeRefToken,
  ref,
  refChannel,
} from "../domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./types.js";
import { nameOfType } from "./types.js";
import {
  buildOperationMessageRef,
  registerMessage,
} from "./channel-builder.js";

/** Build all operations from discovered ops, applying decorators and replies. */
export function buildOperations(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const op of ctx.discoveredOps) {
    for (let i = 0; i < op.messageNames.length; i++) {
      const schemaName = op.messageSchemaNames[i] ?? op.messageNames[i];
      registerMessage(
        ctx,
        op.messageNames[i],
        op.channelKey,
        undefined,
        schemaName,
      );
    }

    const operationObj: OperationObject = {
      action: op.action,
      channel: refChannel(op.channelKey),
      messages: op.messageNames.map((name) =>
        buildOperationMessageRef(op.channelKey, name),
      ),
    };

    const opType = [...state.operations.keys(), ...state.channels.keys()].find(
      (t) => nameOfType(t) === op.opName,
    );
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

      const replyData = state.operationReplies.get(opType);
      if (replyData) {
        const { replyKey, schemaName } = resolveReplyKey(
          state,
          replyData.messageName,
        );
        registerMessage(ctx, replyKey, op.channelKey, undefined, schemaName);
        const reply: OperationReply = {
          messages: [
            ref(
              `#/channels/${escapeRefToken(op.channelKey)}/messages/${escapeRefToken(replyKey)}`,
            ),
          ],
        };
        if (replyData.address) {
          reply.address = {
            location: replyData.address,
          };
        }
        operationObj.reply = reply;
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

/** Resolve the effective reply message key, checking @messageId overrides. */
function resolveReplyKey(
  state: AsyncAPIConsolidatedState,
  modelName: string,
): { replyKey: string; schemaName: string } {
  for (const [modelType, msgData] of state.messages) {
    if (nameOfType(modelType) === modelName && msgData.messageId) {
      return { replyKey: msgData.messageId, schemaName: modelName };
    }
  }
  return { replyKey: modelName, schemaName: modelName };
}
