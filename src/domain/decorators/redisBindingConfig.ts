//TODO: Split this into it's own file!
export type RedisBindingConfig = {
  /** Redis channel or stream */
  channel?: string;
  /** Redis stream consumer group */
  consumerGroup?: string;
  /** Redis message ID */
  messageId?: string;
};
