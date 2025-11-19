//TODO: Get inspired by this setup for other const's too!

const CLOUD_BINDING_TYPE = [
  "kafka",
  "amqp",
  "websocket",
  "aws-sns",
  "aws-sqs",
  "gcp-pubsub",
  "azure-servicebus",
  "redis",
  "pulsar",
] as const;

/**
 * Supported cloud binding types
 */
export type CloudBindingType = (typeof CLOUD_BINDING_TYPE)[number];

/**
 * Get all supported binding types
 */
export function getSupportedBindingTypes(): readonly CloudBindingType[] {
  return CLOUD_BINDING_TYPE;
}
