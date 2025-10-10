import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Simple Multi-Protocol Example
 */

namespace SimpleIoT;

/**
 * IoT device telemetry data
 */
model DeviceTelemetry {
  deviceId: string;
  temperature: float32;
  humidity: float32;
  timestamp: utcDateTime;
}

/**
 * Device alert data
 */
model DeviceAlert {
  deviceId: string;
  alertType: "high_temp" | "low_battery" | "offline";
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: utcDateTime;
}

/**
 * MQTT: Publish device telemetry
 */
@channel("devices.{deviceId}/telemetry")
@publish
op publishDeviceTelemetry(deviceId: string): DeviceTelemetry;

/**
 * MQTT: Publish device alerts
 */
@channel("devices.{deviceId}/alerts")
@publish
op publishDeviceAlert(deviceId: string): DeviceAlert;

/**
 * WebSocket: Real-time dashboard updates
 */
@channel("dashboard.updates")
@publish
op publishDashboardUpdate(): DashboardUpdate;

/**
 * Dashboard update event
 */
model DashboardUpdate {
  type: "new_device" | "alert" | "telemetry";
  deviceId?: string;
  data: Record<string>;
  timestamp: utcDateTime;
}

/**
 * HTTP: Webhook notifications
 */
@channel("webhook.notifications")
@publish
op publishWebhookNotification(): WebhookNotification;

/**
 * Webhook notification
 */
model WebhookNotification {
  event: string;
  deviceId?: string;
  timestamp: utcDateTime;
  payload: Record<string>;
}

/**
 * Kafka: Processed data streams
 */
@channel("processed.data")
@publish
op publishProcessedData(): ProcessedData;

/**
 * Processed data for analytics
 */
model ProcessedData {
  deviceId: string;
  processedAt: utcDateTime;
  insights: DataInsight[];
}

/**
 * Data insight from processing
 */
model DataInsight {
  metric: string;
  value: float64;
  trend: "up" | "down" | "stable";
}