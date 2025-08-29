/**
 * Example of versioned AsyncAPI service using TypeSpec.Versioning
 */

import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

/**
 * API Version enumeration
 */
enum APIVersions {
  v1_0: "1.0",
  v1_1: "1.1", 
  v2_0: "2.0",
}

/**
 * Event streaming service with versioning
 */
@versioned(APIVersions)
@service({ 
  title: "Event Streaming API", 
  version: "2.0",
  description: "Event-driven API with versioning support"
})
@server("wss://events.example.com", "WebSocket Events Server")
@server("kafka://events.example.com:9092", "Kafka Events Server")
namespace EventStreamingAPI;

/**
 * User model that evolves across versions
 */
@doc("Represents a user in the system")
@example({
  id: "user123",
  name: "John Doe",
  email: "john@example.com"
})
model User {
  @doc("User identifier")
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's email address (added in v1.1)")
  @added(APIVersions.v1_1)
  email?: string;

  @doc("User's phone number (removed in v2.0)")
  @removed(APIVersions.v2_0)
  @deprecated("Phone verification moved to separate service")
  phoneNumber?: string;

  @doc("Account creation timestamp")
  createdAt: utcDateTime;

  @doc("User status (made optional in v2.0)")
  @madeOptional(APIVersions.v2_0)
  status?: "active" | "inactive" | "pending";

  @doc("User preferences (added in v2.0)")
  @added(APIVersions.v2_0)
  preferences?: UserPreferences;
}

/**
 * User preferences model (v2.0+)
 */
@added(APIVersions.v2_0)
@doc("User preference settings")
model UserPreferences {
  @doc("Notification preferences")
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @doc("Theme preference")
  theme: "light" | "dark" | "auto";

  @doc("Language preference")
  language: string;
}

/**
 * Event data for user operations
 */
@doc("User event payload")
model UserEvent {
  @doc("Event type")
  eventType: "created" | "updated" | "deleted";

  @doc("User data")
  user: User;

  @doc("Event timestamp")
  timestamp: utcDateTime;

  @doc("Event metadata (added in v1.1)")
  @added(APIVersions.v1_1)
  metadata?: EventMetadata;
}

/**
 * Event metadata (v1.1+)
 */
@added(APIVersions.v1_1)
@doc("Additional event metadata")
model EventMetadata {
  @doc("Source system")
  source: string;

  @doc("Correlation ID")
  correlationId: string;

  @doc("Event version")
  version: string;

  @doc("Trace context (added in v2.0)")
  @added(APIVersions.v2_0)
  traceContext?: string;
}

/**
 * User operations interface
 */
interface UserOperations {
  @doc("Publish user created event")
  @route("/events/users/created")
  publishUserCreated(@body event: UserEvent): void;

  @doc("Publish user updated event")  
  @route("/events/users/updated")
  publishUserUpdated(@body event: UserEvent): void;

  @doc("Publish user deleted event")
  @route("/events/users/deleted")
  publishUserDeleted(@body event: UserEvent): void;

  @doc("Bulk user operations (added in v2.0)")
  @added(APIVersions.v2_0)
  @route("/events/users/bulk")
  publishBulkUserOperation(@body events: UserEvent[]): void;

  @doc("User preferences changed (added in v2.0)")
  @added(APIVersions.v2_0)
  @route("/events/users/preferences-changed")
  publishUserPreferencesChanged(@body event: UserEvent): void;
}