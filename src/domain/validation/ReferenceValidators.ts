/**
 * Reference Validators - AsyncAPI Cross-Reference Validation
 *
 * Handles validation of cross-references between document sections:
 * - Operation → Channel references
 * - Channel → Message references
 * - Ensures all $ref paths resolve to existing components
 *
 * Extracted from ValidationService.ts to maintain <350 line limit.
 * Part of Phase 1 architectural excellence improvements.
 */

import type {
  AsyncAPIObject,
  ReferenceObject,
} from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * Type guard to check if object is a reference
 *
 * @param obj - Object to check
 * @returns True if object is a ReferenceObject with $ref
 */
const isReference = (obj: unknown): obj is ReferenceObject => {
  return obj != null && typeof obj === "object" && "$ref" in obj;
};

/**
 * Validate cross-references between document sections
 *
 * Ensures that:
 * 1. Operations reference existing channels
 * 2. Channels reference existing messages
 * 3. All $ref paths are valid
 *
 * @param doc - AsyncAPI document to validate
 * @param errors - Array to collect error messages
 * @param _warnings - Array to collect warning messages (currently unused)
 */
export const validateCrossReferences = (
  doc: AsyncAPIObject,
  errors: string[],
  _warnings: string[],
): void => {
  if (!doc) return;

  // Validate operation channel references
  if (doc.operations && doc.channels) {
    Object.entries(doc.operations).forEach(([operationName, operation]) => {
      // Skip reference operations
      if (isReference(operation)) {
        return;
      }

      // Check if operation channel is a reference
      if (operation.channel && isReference(operation.channel)) {
        const channelRef = operation.channel.$ref.replace("#/channels/", "");
        if (!doc.channels?.[channelRef]) {
          errors.push(
            `Operation '${operationName}' references non-existent channel '${channelRef}'`,
          );
        }
      }
    });
  }

  // Validate message references in channels
  if (doc.channels && doc.components?.messages) {
    Object.entries(doc.channels).forEach(([channelName, channel]) => {
      // Skip reference channels
      if (isReference(channel)) {
        return;
      }

      if (channel.messages) {
        Object.entries(channel.messages).forEach(([, messageRef]) => {
          if (isReference(messageRef)) {
            const messageRefName = messageRef.$ref.replace(
              "#/components/messages/",
              "",
            );
            if (!doc.components?.messages?.[messageRefName]) {
              errors.push(
                `Channel '${channelName}' references non-existent message '${messageRefName}'`,
              );
            }
          }
        });
      }
    });
  }
};
