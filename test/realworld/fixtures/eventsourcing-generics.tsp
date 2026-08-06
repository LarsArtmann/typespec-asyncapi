// =============================================================================
// Pattern Source: typespec-eventsourcing (src/types/branded-ids.tsp, events.tsp)
// Pattern: Generic models with constrained type parameters, spread of generic
//          with string literal argument, phantom brand fields, named unions,
//          3-level inheritance chains with eventType narrowing
// =============================================================================

@service(#{ title: "Event Sourcing Domain" })
@server("broker", #{ url: "kafka://eventsourcing-broker:9092", protocol: "kafka" })
namespace EventSourcingDomain;

// --- Generic branded ID model ---
model BrandedId<Brand extends string> {
  value: string;
  __brand: Brand;
}

// --- Concrete branded IDs via spread ---
model EventId {
  ...BrandedId<"event">;
}

model AggregateId {
  ...BrandedId<"aggregate">;
}

model CommandId {
  ...BrandedId<"command">;
}

model CorrelationId {
  ...BrandedId<"correlation">;
}

model QueryId {
  ...BrandedId<"query">;
}

// --- Operation result union ---
model CommandSuccess {
  commandId: CommandId;
  isSuccess: true;
  result: unknown;
  timestamp: utcDateTime;
}

model CommandFailure {
  commandId: CommandId;
  isSuccess: false;
  failureReason: "validation" | "business-rule" | "concurrency" | "authorization" | "system" | "timeout";
  errorMessage: string;
  timestamp: utcDateTime;
}

union CommandResult {
  success: CommandSuccess,
  failure: CommandFailure,
}

// --- 3-level event hierarchy ---
model BaseEvent {
  eventId: EventId;
  aggregateId: AggregateId;
  eventType: string;
  eventVersion: int32 = 1;
  timestamp: utcDateTime;
  correlationId: CorrelationId;
  eventData: Record<unknown>;
}

model BaseCreatedEvent extends BaseEvent {
  eventType: "entity.created";
  eventData: {
    entityName: string;
    initialData: Record<unknown>;
  };
}

model BaseUpdatedEvent extends BaseEvent {
  eventType: "entity.updated";
  eventData: {
    entityName: string;
    previousValue: unknown;
    newValue: unknown;
    fieldsToUpdate: Record<unknown>;
  };
}

model BaseDeletedEvent extends BaseEvent {
  eventType: "entity.deleted";
  eventData: {
    entityName: string;
    deletionReason: string;
    softDelete: boolean = true;
  };
}

// --- Concrete domain events (3rd level) ---
model UserCreatedEvent extends BaseCreatedEvent {
  eventType: "user.created";
  eventData: {
    entityName: "User";
    initialData: {
      email: string;
      name: string;
      roles: string[];
      isActive: boolean = true;
    };
  };
}

model UserUpdatedEvent extends BaseUpdatedEvent {
  eventType: "user.updated";
  eventData: {
    entityName: "User";
    fieldsChanged: string[];
    transitionContext: Record<string>;
  };
}

model UserDeletedEvent extends BaseDeletedEvent {
  eventType: "user.deleted";
  eventData: {
    entityName: "User";
    deletionReason: "self-initiated" | "admin-action" | "gdpr-request" | "inactivity";
    softDelete: boolean;
  };
}

// --- Snapshot event ---
model AggregateSnapshotEvent extends BaseEvent {
  eventType: "aggregate.snapshot";
  eventData: {
    aggregateType: string;
    aggregateVersion: int64;
    eventsSinceLastSnapshot: int32;
    snapshotData: unknown;
    compressionType: "gzip" | "lz4" | "none" = "none";
  };
}

// --- Error details ---
model ErrorDetails {
  code: string;
  message: string;
  details: Record<string>;
  stackTrace: string;
}

// --- Validation result ---
model CommandValidationResult {
  commandId: CommandId;
  valid: boolean;
  ruleViolations: {
    rule: string;
    field: string;
    message: string;
    severity: "error" | "warning";
  }[];
}

// --- AsyncAPI Operations ---
@doc("Publish user created event")
@channel("events.user.created")
@publish
op publishUserCreatedEvent(): UserCreatedEvent;

@doc("Publish user updated event")
@channel("events.user.updated")
@publish
op publishUserUpdatedEvent(): UserUpdatedEvent;

@doc("Publish user deleted event")
@channel("events.user.deleted")
@publish
op publishUserDeletedEvent(): UserDeletedEvent;

@doc("Publish aggregate snapshot")
@channel("events.aggregate.snapshot")
@publish
op publishAggregateSnapshot(): AggregateSnapshotEvent;

@doc("Publish command result")
@channel("events.command.result")
@publish
op publishCommandResult(): CommandResult;

@doc("Publish validation result")
@channel("events.validation.result")
@publish
op publishValidationResult(): CommandValidationResult;

@doc("Subscribe to command processing")
@channel("commands.process")
@subscribe
op subscribeCommandProcessing(commandId: string): CommandResult;
