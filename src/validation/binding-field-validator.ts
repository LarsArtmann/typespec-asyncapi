/**
 * Binding Field Validator
 *
 * Validates individual binding field values against known constraints
 * derived from the @asyncapi/specs binding definitions.
 *
 * This catches common errors like invalid qos values, wrong types for
 * numeric fields, or unknown binding keys — at decorator time, before
 * the full document validation.
 */

import type { BindingDiagnosticCode } from "./binding-validator.js";

export interface BindingFieldIssue {
  code: BindingDiagnosticCode;
  key: string;
  format: Record<string, unknown>;
}

interface FieldRule {
  type?: "string" | "number" | "integer" | "boolean";
  enum?: unknown[];
  min?: number;
  max?: number;
}

type TargetRules = Record<string, FieldRule>;

const MqttRules: Record<string, TargetRules> = {
  operation: {
    qos: { type: "integer", enum: [0, 1, 2] },
    retain: { type: "boolean" },
    messageExpiryInterval: { type: "integer", min: 0 },
  },
  server: {
    clientId: { type: "string" },
    cleanSession: { type: "boolean" },
    lastWill: { type: "string" },
    keepAlive: { type: "integer", min: 0 },
    bindingVersion: { type: "string" },
  },
  message: {
    correlationData: { type: "string" },
    correlationDataContentType: { type: "string" },
    payloadFormatIndicator: { type: "integer", enum: [0, 1] },
    bindingVersion: { type: "string" },
  },
};

const KafkaRules: Record<string, TargetRules> = {
  channel: {
    topic: { type: "string" },
    partitions: { type: "integer", min: 1 },
    replicas: { type: "integer", min: 1 },
    bindingVersion: { type: "string" },
  },
  operation: {
    groupId: { type: "string" },
    clientId: { type: "string" },
    bindingVersion: { type: "string" },
  },
  message: {
    key: { type: "string" },
    schemaIdLocation: { type: "string" },
    bindingVersion: { type: "string" },
  },
};

const AmqpRules: Record<string, TargetRules> = {
  operation: {
    priority: { type: "integer", min: 0 },
    deliveryMode: { type: "integer", enum: [1, 2] },
    timestamp: { type: "boolean" },
    ack: { type: "boolean" },
    bindingVersion: { type: "string" },
  },
  message: {
    contentEncoding: { type: "string" },
    messageType: { type: "string" },
    bindingVersion: { type: "string" },
  },
  channel: {
    is: { type: "string", enum: ["routingKey", "queue"] },
    exchange: { type: "string" },
    queue: { type: "string" },
    bindingVersion: { type: "string" },
  },
};

const HttpRules: Record<string, TargetRules> = {
  operation: {
    method: {
      type: "string",
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT"],
    },
    bindingVersion: { type: "string" },
  },
  message: {
    headers: { type: "string" },
    bindingVersion: { type: "string" },
  },
};

const WsRules: Record<string, TargetRules> = {
  channel: {
    method: {
      type: "string",
      enum: ["GET", "POST"],
    },
    query: { type: "string" },
    bindingVersion: { type: "string" },
  },
};

const PROTOCOL_RULES: Record<string, Record<string, TargetRules>> = {
  mqtt: MqttRules,
  kafka: KafkaRules,
  amqp: AmqpRules,
  http: HttpRules,
  ws: WsRules,
};

/**
 * Validate binding field values against known constraints.
 * Returns an array of issues for invalid fields.
 */
export function validateBindingFields(
  protocol: string,
  targetKind: string | undefined,
  binding: Record<string, unknown>,
): BindingFieldIssue[] {
  const issues: BindingFieldIssue[] = [];

  const protocolRules = PROTOCOL_RULES[protocol];
  if (!protocolRules) {
    return issues;
  }

  const rules = targetKind ? protocolRules[targetKind] : undefined;
  if (!rules) {
    return issues;
  }

  for (const [field, value] of Object.entries(binding)) {
    if (field === "bindingVersion") {
      continue;
    }
    const rule = rules[field];
    if (!rule) {
      continue;
    }

    if (rule.type && typeof value !== rule.type) {
      if (rule.type === "integer" && typeof value === "number" && Number.isInteger(value)) {
        continue;
      }
      issues.push({
        code: "invalid-binding-version" as BindingDiagnosticCode,
        key: field,
        format: {
          field,
          expected: rule.type,
          actual: typeof value,
          protocol,
        },
      });
      continue;
    }

    if (rule.enum && !rule.enum.includes(value)) {
      issues.push({
        code: "invalid-binding-version" as BindingDiagnosticCode,
        key: field,
        format: {
          field,
          validValues: rule.enum.join(", "),
          actual: String(value),
          protocol,
        },
      });
    }

    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        issues.push({
          code: "invalid-binding-version" as BindingDiagnosticCode,
          key: field,
          format: {
            field,
            min: rule.min,
            actual: value,
            protocol,
          },
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        issues.push({
          code: "invalid-binding-version" as BindingDiagnosticCode,
          key: field,
          format: {
            field,
            max: rule.max,
            actual: value,
            protocol,
          },
        });
      }
    }
  }

  return issues;
}
