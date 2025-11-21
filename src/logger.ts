/**
 * Effect Logger Configuration
 *
 * Centralized logging setup using Effect's Logger service.
 * Provides composable, testable logging with proper Layer patterns.
 *
 * @see https://effect.website/docs/observability/logging/
 */

import { Effect, Logger } from "effect";

/**
 * Custom console logger with structured output
 *
 * Formats log messages with level, timestamp, and annotations
 */
export const consoleLogger = Logger.make(({ logLevel, message, annotations }) => {
  const timestamp = new Date().toISOString();
  const level = logLevel.label.toUpperCase().padEnd(5);

  // Format base message
  let output = `[${timestamp}] [${level}] ${String(message)}`;

  // Add annotations if present
  const annotationEntries = Object.entries(annotations);
  if (annotationEntries.length > 0) {
    const annotationsStr = annotationEntries
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
    output += ` | ${annotationsStr}`;
  }

  // Output to console based on log level (ESLint compliant)
  switch (logLevel._tag) {
    case "Fatal":
    case "Error":
      // eslint-disable-next-line no-console
      console.error(output);
      break;
    case "Warning":
      // eslint-disable-next-line no-console
      console.warn(output);
      break;
    case "Debug":
    case "Info":
    case "Trace":
    default:
      // eslint-disable-next-line no-console
      console.log(output);
      break;
  }
});

/**
 * Production Logger Layer
 *
 * Replaces default Effect logger with our custom console logger.
 * Use this in production code.
 */
export const LoggerLive = Logger.replace(Logger.defaultLogger, consoleLogger);

/**
 * Test Logger Layer (Silent)
 *
 * Disables logging output for tests. Use this in test setup.
 */
export const loggerTest = Logger.replace(
  Logger.defaultLogger,
  Logger.make(() => {
    // Silent logger - no output
  })
);

/**
 * Development Logger Layer with Debug level
 *
 * Shows all logs including DEBUG level for development.
 * Note: Apply log level using Layer.provide pattern in your program.
 */
export const loggerDev = Logger.replace(Logger.defaultLogger, consoleLogger);

/**
 * Helper: Run an Effect program with production logger
 *
 * Convenience function for running Effects with logging enabled.
 *
 * @example
 * const program = Effect.gen(function*() {
 *   yield* Effect.log("Starting");
 *   return yield* someOperation();
 * });
 *
 * await runWithLogging(program);
 */
export const runWithLogging = <A, E>(
  effect: Effect.Effect<A, E>
): Promise<A> => {
  return Effect.runPromise(effect.pipe(Effect.provide(LoggerLive)));
};

/**
 * Helper: Run an Effect program without logging (for tests)
 *
 * @example
 * await runSilent(program);
 */
export const runSilent = <A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> => {
  return Effect.runPromise(effect.pipe(Effect.provide(loggerTest)));
};
