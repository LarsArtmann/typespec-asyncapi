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
import {
  $defaultContentType,
  $messageTrait,
  $operationTrait,
  $parameter,
  $reusableBinding,
  $reusableCorrelationId,
  $server,
} from "./namespace-decorators.js";
import {
  $useBinding,
  $useChannelBinding,
  $useCorrelationId,
  $useMessageTrait,
  $useOperationTrait,
} from "./use-decorators.js";

// CRITICAL: TypeSpec requires $decorators object export
export const $decorators = {
  "TypeSpec.AsyncAPI": {
    apiVersion: $apiVersion,
    bindings: $bindings,
    channel: $channel,
    correlationId: $correlationId,
    defaultContentType: $defaultContentType,
    header: $header,
    message: $message,
    messageId: $messageId,
    messageTrait: $messageTrait,
    operationId: $operationId,
    operationTrait: $operationTrait,
    parameter: $parameter,
    protocol: $protocol,
    publish: $publish,
    reusableBinding: $reusableBinding,
    reusableCorrelationId: $reusableCorrelationId,
    reply: $reply,
    security: $security,
    server: $server,
    subscribe: $subscribe,
    tags: $tags,
    useBinding: $useBinding,
    useChannelBinding: $useChannelBinding,
    useCorrelationId: $useCorrelationId,
    useMessageTrait: $useMessageTrait,
    useOperationTrait: $useOperationTrait,
  },
};
