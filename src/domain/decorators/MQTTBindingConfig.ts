//TODO: Split this into it's own file!
export type MQTTBindingConfig = {
	/** Topic name */
	topic?: string;
	//TODO: HARDCODED MQTT QOS LEVELS! ANOTHER ASYNCAPI STANDARDS VIOLATION!
	//TODO: CRITICAL MQTT SPEC VIOLATION - QoS levels should reference MQTT specification constants!
	//TODO: MAGIC NUMBER DISASTER - 0, 1, 2 literals should be named MQTT_QOS constants!
	//TODO: ASYNCAPI COMPLIANCE FAILURE - Machine-readable interfaces require proper MQTT binding references!
	/** Quality of Service level */
	qos?: 0 | 1 | 2;
	/** Retain flag */
	retain?: boolean;
	/** Clean session flag */
	cleanSession?: boolean;
	/** Keep alive interval */
	keepAlive?: number;
}