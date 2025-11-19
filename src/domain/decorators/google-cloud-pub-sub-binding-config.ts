/**
 * Google Cloud Pub/Sub binding configuration
 * TODO: Improve types!
 */
export type GoogleCloudPubSubBindingConfig = {
  /** Topic name */
  topic: string;
  /** Project ID */
  projectId?: string;
  /** Subscription name for subscribers */
  subscription?: string;
  /** Message ordering key */
  orderingKey?: string;
  /** Message attributes */
  attributes?: Record<string, string>;
  /** Dead letter policy */
  deadLetterPolicy?: {
    deadLetterTopic: string;
    maxDeliveryAttempts: number;
  };
  /** Retry policy */
  retryPolicy?: {
    minimumBackoff: string;
    maximumBackoff: string;
  };
};
