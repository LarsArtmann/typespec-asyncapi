//TODO: Split this into it's own file!
export type AMQPBindingConfig = {
  /** Exchange name */
  exchange?: string;
  /** Queue name */
  queue?: string;
  /** Routing key */
  routingKey?: string;
  //TODO: HARDCODED AMQP CONSTANTS! VIOLATE ASYNCAPI MACHINE-READABLE PRINCIPLES!
  //TODO: CRITICAL ASYNCAPI VIOLATION - Delivery modes should reference AMQP specification constants!
  //TODO: MAGIC NUMBER ANTI-PATTERN - 1, 2 literals should be named constants from AMQP spec!
  //TODO: STANDARDS COMPLIANCE FAILURE - AsyncAPI spec requires proper AMQP binding references!
  /** Message delivery mode */
  deliveryMode?: 1 | 2; // 1 = non-persistent, 2 = persistent
  /** Message priority */
  priority?: number;
  /** Message TTL in milliseconds */
  expiration?: number;
};
