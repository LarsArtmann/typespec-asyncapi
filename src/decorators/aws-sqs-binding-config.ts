/**
 * AWS SQS binding configuration
 * TODO: Improve types!
 */
export type AwsSqsBindingConfig = {
	/** Queue name or URL */
	queue: string;
	/** AWS region */
	region?: string;
	/** Message group ID for FIFO queues */
	messageGroupId?: string;
	/** Message deduplication ID */
	messageDeduplicationId?: string;
	/** Visibility timeout in seconds */
	visibilityTimeoutSeconds?: number;
	/** Dead letter queue configuration */
	deadLetterQueue?: {
		targetArn: string;
		maxReceiveCount: number;
	};
}