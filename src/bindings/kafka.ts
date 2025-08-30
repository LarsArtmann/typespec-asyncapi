/**
 * Essential Kafka Protocol Bindings for AsyncAPI
 * 
 * Implements core Kafka features only:
 * - Topic configuration
 * - Partition settings  
 * - Consumer group bindings
 * 
 * LIMITATIONS: Advanced Kafka features not yet supported
 * - Schema Registry integration
 * - Complex serialization options
 * - Advanced security configurations
 * - Custom partitioners
 * - Exactly-once semantics
 */

export type KafkaChannelBinding = {
  /** Kafka topic name */
  topic: string;
  /** Number of partitions (optional, defaults to cluster setting) */
  partitions?: number;
  /** Replication factor (optional, defaults to cluster setting) */
  replicas?: number;
  /** Topic configuration overrides */
  configs?: Record<string, string>;
}

export type KafkaOperationBinding = {
  /** Consumer group ID for subscribe operations */
  groupId?: string;
  /** Client ID for identification */
  clientId?: string;
  /** Whether to auto-commit offsets */
  autoCommit?: boolean;
  /** Auto-commit interval in milliseconds */
  autoCommitIntervalMs?: number;
}

export type KafkaMessageBinding = {
  /** Message key (for partitioning) */
  key?: {
    type: "string" | "avro" | "json";
    schema?: string;
  };
  /** Message headers */
  headers?: Record<string, {
    type: "string" | "integer" | "bytes";
    description?: string;
  }>;
  /** Schema ID for schema registry (if using) */
  schemaIdLocation?: "payload" | "header";
}

export type KafkaServerBinding = {
  /** Schema registry URL (if using) */
  schemaRegistryUrl?: string;
  /** Schema registry vendor */
  schemaRegistryVendor?: "confluent" | "apicurio";
}

/**
 * Essential Kafka binding types for AsyncAPI generation
 */
export type KafkaBindings = {
  channel?: KafkaChannelBinding;
  operation?: KafkaOperationBinding;
  message?: KafkaMessageBinding;
  server?: KafkaServerBinding;
};

/**
 * Validate essential Kafka channel binding
 */
export function validateKafkaChannelBinding(binding: KafkaChannelBinding): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate topic name
  if (!binding.topic || binding.topic.trim() === '') {
    errors.push("Topic name is required");
  } else {
    // Kafka topic naming rules
    if (!/^[a-zA-Z0-9._-]+$/.test(binding.topic)) {
      errors.push("Topic name contains invalid characters. Use only letters, numbers, dots, underscores, and hyphens");
    }
    if (binding.topic.length > 249) {
      errors.push("Topic name cannot exceed 249 characters");
    }
  }

  // Validate partitions
  if (binding.partitions !== undefined) {
    if (!Number.isInteger(binding.partitions) || binding.partitions < 1) {
      errors.push("Partitions must be a positive integer");
    } else if (binding.partitions > 1000) {
      warnings.push("High partition count may impact performance");
    }
  }

  // Validate replicas
  if (binding.replicas !== undefined) {
    if (!Number.isInteger(binding.replicas) || binding.replicas < 1) {
      errors.push("Replicas must be a positive integer");
    } else if (binding.replicas > 10) {
      warnings.push("Very high replication factor may impact performance");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate essential Kafka operation binding
 */
export function validateKafkaOperationBinding(binding: KafkaOperationBinding): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate group ID
  if (binding.groupId !== undefined) {
    if (binding.groupId.trim() === '') {
      errors.push("Group ID cannot be empty");
    } else if (!/^[a-zA-Z0-9._-]+$/.test(binding.groupId)) {
      errors.push("Group ID contains invalid characters");
    }
  }

  // Validate client ID
  if (binding.clientId !== undefined) {
    if (binding.clientId.trim() === '') {
      errors.push("Client ID cannot be empty");
    } else if (binding.clientId.length > 255) {
      errors.push("Client ID cannot exceed 255 characters");
    }
  }

  // Validate auto-commit interval
  if (binding.autoCommitIntervalMs !== undefined) {
    if (!Number.isInteger(binding.autoCommitIntervalMs) || binding.autoCommitIntervalMs < 0) {
      errors.push("Auto-commit interval must be a non-negative integer");
    } else if (binding.autoCommitIntervalMs < 100) {
      warnings.push("Very low auto-commit interval may impact performance");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create default Kafka channel binding
 */
export function createDefaultKafkaChannelBinding(topicName: string): KafkaChannelBinding {
  return {
    topic: topicName,
    // Use cluster defaults for partitions and replicas
    // Most production clusters have sensible defaults
  };
}

/**
 * Create default Kafka operation binding for consumers
 */
export function createDefaultKafkaOperationBinding(groupId: string): KafkaOperationBinding {
  return {
    groupId,
    autoCommit: true,
    autoCommitIntervalMs: 5000, // 5 seconds - reasonable default
  };
}

/**
 * Utility functions for working with Kafka bindings
 */
export const KafkaBindingUtils = {
  /**
   * Check if a topic name is valid
   */
  isValidTopicName(topic: string): boolean {
    return topic.length > 0 && 
           topic.length <= 249 && 
           /^[a-zA-Z0-9._-]+$/.test(topic);
  },

  /**
   * Sanitize topic name by replacing invalid characters
   */
  sanitizeTopicName(topic: string): string {
    return topic
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 249);
  },

  /**
   * Generate a default group ID from operation name
   */
  generateGroupId(operationName: string, namespace?: string): string {
    const base = namespace ? `${namespace}_${operationName}` : operationName;
    return this.sanitizeTopicName(`${base}_consumer_group`);
  }
};