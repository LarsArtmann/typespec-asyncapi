/**
 * Kafka binding configuration (enhanced)
 * TODO: Improve types!
 */
export type KafkaBindingConfig = {
	/** Topic name */
	topic: string;
	/** Partition key */
	key?: string;
	/** Number of partitions */
	partitions?: number;
	/** Replication factor */
	replicas?: number;
	/** Cleanup policy */
	cleanup?: 'delete' | 'compact' | 'compact,delete';
	/** Retention time in milliseconds */
	retentionMs?: number;
	/** Consumer group ID */
	groupId?: string;
	/** Schema registry configuration */
	schemaRegistry?: {
		url: string;
		subjectName: string;
		version?: string;
	};
}