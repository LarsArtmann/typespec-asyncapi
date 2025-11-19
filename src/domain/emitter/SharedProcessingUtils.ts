import { Effect } from "effect";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import type { Program } from "@typespec/compiler";

/**
 * Shared processing utilities for consistent patterns
 * Eliminates duplication between OperationProcessingService and MessageProcessingService
 */

/**
 * Generic processing function with consistent logging and structure
 * Returns processed items to match existing pattern
 */
export const processItemsWithEffect = <TItem, TResult>(
  items: TItem[],
  itemTypeName: string,
  processFn: (item: TItem) => Effect.Effect<TResult, never>,
  logPrefix: string = "🔄",
): Effect.Effect<TResult[], never> => {
  return Effect.gen(function* () {
    yield* Effect.log(
      `${logPrefix} Processing ${items.length} ${itemTypeName} with Effect.TS...`,
    );

    // Process all items in parallel for performance
    const results = yield* Effect.all(items.map((item) => processFn(item)));

    yield* Effect.log(
      `✅ Processed ${items.length} ${itemTypeName} successfully`,
    );
    return results;
  });
};

/**
 * Processing context for consistent error handling and metrics
 */
export const createProcessingContext = (
  asyncApiDoc: AsyncAPIObject,
  program: Program,
) => ({
  asyncApiDoc,
  program,
  startTime: performance.now(),
});

/**
 * Extract processing metrics
 */
export const getProcessingMetrics = (startTime: number) => ({
  duration: performance.now() - startTime,
  processedAt: new Date(),
});
