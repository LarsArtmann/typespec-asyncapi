//TODO: ASYNCAPI STANDARDS VIOLATION! PROTOCOL BINDINGS SCATTERED IN ONE MASSIVE FILE!
//TODO: CRITICAL ARCHITECTURAL FAILURE - Each protocol binding should be separate module per AsyncAPI best practices!
//TODO: MACHINE-READABLE INTERFACE VIOLATION - Hardcoded binding types prevent dynamic protocol discovery!
//TODO: MAINTAINABILITY DISASTER - Adding new protocols requires modifying this monolithic file!
//TODO: Split this into it's own file!
export type KafkaBindingConfig = {
	/** Kafka topic name */
	topic?: string;
	/** Partition key field */
	key?: string;
	/** Schema registry configuration */
	schemaIdLocation?: "payload" | "header";
	/** Schema registry ID */
	schemaId?: number;
	/** Schema lookup strategy */
	schemaLookupStrategy?: "TopicIdStrategy" | "RecordNameStrategy" | "TopicRecordNameStrategy";
	/** Consumer group ID */
	groupId?: string;
	/** Client ID */
	clientId?: string;
}