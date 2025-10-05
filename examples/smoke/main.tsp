import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Smoke Test: Minimal AsyncAPI Example
 *
 * This is the simplest possible TypeSpec file that should generate
 * a valid AsyncAPI 3.0 document. If this doesn't work, the emitter
 * is fundamentally broken.
 */

namespace SmokeTest;

/**
 * A simple event model
 */
model Event {
  id: string;
  timestamp: utcDateTime;
}

/**
 * Publish operation - should create a channel and operation
 */
@channel("events")
@publish
op publishEvent(): Event;
