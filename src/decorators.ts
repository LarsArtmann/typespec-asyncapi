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
  $bindings,
  $channel,
  $correlationId,
  $header,
  $message,
  $messageId,
  $operationId,
  $apiVersion,
  $protocol,
  $publish,
  $reply,
  $security,
  $subscribe,
  $tags,
} from "./minimal-decorators.js";
import { $server, $defaultContentType } from "./namespace-decorators.js";

// CRITICAL: TypeSpec requires $decorators object export
export const $decorators = {
  "TypeSpec.AsyncAPI": {
    bindings: $bindings,
    channel: $channel,
    correlationId: $correlationId,
    defaultContentType: $defaultContentType,
    header: $header,
    message: $message,
    messageId: $messageId,
    operationId: $operationId,
    apiVersion: $apiVersion,
    protocol: $protocol,
    publish: $publish,
    reply: $reply,
    security: $security,
    server: $server,
    subscribe: $subscribe,
    tags: $tags,
  },
};
