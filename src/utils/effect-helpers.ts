/**
 * Effect Helper Utilities for TypeSpec AsyncAPI Emitter
 */

import { Effect } from "effect";

export type EffectResult<T> = {
  data: T;
  error?: Error;
}

export type EffectOptions = {
  timeout?: number;
  retries?: number;
}

/**
 * Simple effect execution utility using Effect.TS patterns
 */
export async function executeEffect<T>(
  fn: () => Promise<T>,
  options?: EffectOptions
): Promise<EffectResult<T>> {
  const timeout = options?.timeout ?? 5000;

  try {
    const data = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ]);
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined as T, error: error as Error };
  }
}

/**
 * Validate effect result
 */
export function isEffectSuccess<T>(result: EffectResult<T>): result is { data: T; error?: undefined } {
  return !result.error;
}

/**
 * Get effect error
 */
export function getEffectError<T>(result: EffectResult<T>): Error | undefined {
  return result.error;
}