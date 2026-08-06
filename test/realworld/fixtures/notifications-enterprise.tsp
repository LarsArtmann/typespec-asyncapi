// =============================================================================
// Canonical AsyncAPI Spec: Notification Service (HTTP + AMQP)
//
// An enterprise notification service: multi-channel delivery (email, SMS,
// push, webhook), templating, delivery tracking, and dead-letter queues.
// Demonstrates security schemes, complex status tracking, and AMQP bindings.
//
// Real-world patterns: HTTP apiKey auth, AMQP protocol, notification
// templates, delivery status tracking, retry/failure handling, webhooks.
// =============================================================================

@service(#{ title: "Notification Service" })
@apiVersion("3.1.0")
@server("amqp", #{ url: "amqp://notification-queue:5672", protocol: "amqp" })
@server("api", #{ url: "https://api.notifications.example.com", protocol: "https" })
@defaultContentType("application/json")
namespace NotificationService;

// --- Enums ---
enum NotificationChannel {
  email: "email",
  sms: "sms",
  push: "push",
  webhook: "webhook",
  slack: "slack",
  teams: "teams",
}

enum DeliveryStatus {
  queued: "queued",
  sent: "sent",
  delivered: "delivered",
  failed: "failed",
  bounced: "bounced",
  unsubscribed: "unsubscribed",
  deferred: "deferred",
  cancelled: "cancelled",
}

enum NotificationPriority {
  low: "low",
  normal: "normal",
  high: "high",
  urgent: "urgent",
}

// --- Notification models ---
model NotificationRequest {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  templateId: string;
  templateData: Record<string>;
  priority: NotificationPriority = NotificationPriority.normal;
  scheduledAt: string;
  metadata: Record<string>;
  tags: string[];
}

model NotificationRecord {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: DeliveryStatus;
  priority: NotificationPriority;
  attempts: int32 = 0;
  maxAttempts: int32 = 3;
  createdAt: string;
  sentAt: string;
  deliveredAt: string;
  failedAt: string;
  failureReason: string;
  providerMessageId: string;
  metadata: Record<string>;
}

// --- Template model ---
model NotificationTemplate {
  templateId: string;
  name: string;
  channel: NotificationChannel;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
  active: boolean = true;
  version: string = "1.0.0";
  locale: string = "en-US";
}

model TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required: boolean = true;
  defaultValue: string;
  description: string;
}

// --- Delivery events ---
model DeliveryEvent {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  status: DeliveryStatus;
  timestamp: string;
  provider: string;
  providerMessageId: string;
  reason: string;
  metadata: Record<string>;
}

model DeliveryFailureEvent {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  failureReason: string;
  errorCode: string;
  errorMessage: string;
  retryScheduled: boolean = false;
  nextRetryAt: string;
  attempts: int32;
  maxAttempts: int32;
  failedAt: string;
}

// --- Webhook model ---
model WebhookConfig {
  webhookId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean = true;
  retryPolicy: {
    maxRetries: int32 = 5;
    initialDelayMs: int32 = 1000;
    maxDelayMs: int32 = 60000;
    backoffMultiplier: float32 = 2.0;
  };
  headers: Record<string>;
}

model WebhookDeliveryAttempt {
  webhookId: string;
  notificationId: string;
  url: string;
  method: "POST" | "PUT";
  statusCode: int32;
  responseBody: string;
  responseHeaders: Record<string>;
  attemptNumber: int32;
  success: boolean;
  duration: int32;
  timestamp: string;
}

// --- Operations ---
@doc("Notification queued for delivery")
@channel("notifications.queued")
@publish
op publishNotificationQueued(): NotificationRequest;

@doc("Subscribe to notification queue")
@channel("notifications.queued")
@subscribe
op subscribeNotificationQueue(): NotificationRequest;

@doc("Notification delivery status updated")
@channel("notifications.delivery.status")
@publish
op publishDeliveryStatus(): DeliveryEvent;

@doc("Notification delivery failed")
@channel("notifications.delivery.failed")
@publish
op publishDeliveryFailure(): DeliveryFailureEvent;

@doc("Template created or updated")
@channel("notifications.templates.changed")
@publish
op publishTemplateChanged(): NotificationTemplate;

@doc("Webhook delivery attempted")
@channel("notifications.webhooks.delivered")
@publish
op publishWebhookDelivery(): WebhookDeliveryAttempt;

@doc("Subscribe to all notification events for a tenant")
@channel("tenant.{tenantId}.notifications.events")
@subscribe
op subscribeTenantNotifications(tenantId: string): NotificationRecord;

@doc("Subscribe to delivery failures for retry processing")
@channel("notifications.delivery.failures")
@subscribe
op subscribeDeliveryFailures(): DeliveryFailureEvent;
