/**
 * TypeSpec AsyncAPI Decorators - Public API exports
 *
 * This module exports all AsyncAPI decorators for TypeSpec library integration.
 * These exports make decorators available when using "import "@lars-artmann/typespec-asyncapi"
 * in TypeSpec files and provide the JavaScript implementations for the extern dec declarations
 * in lib/main.tsp.
 */

// Import decorator implementations with $ prefix
import {
  $channel,
  $server,
  $publish,
  $message,
  $protocol,
  $security,
  $subscribe,
  $tags,
  $correlationId,
  $bindings,
  $header,
} from "./minimal-decorators.js";

// CRITICAL: TypeSpec namespace declaration
export const namespace = "AsyncAPI";

// CRITICAL: TypeSpec requires $decorators object export
export const $decorators = {
  AsyncAPI: {
    channel: $channel,
    server: $server,
    publish: $publish,
    message: $message,
    protocol: $protocol,
    security: $security,
    subscribe: $subscribe,
    tags: $tags,
    correlationId: $correlationId,
    bindings: $bindings,
    header: $header,
  },
};
