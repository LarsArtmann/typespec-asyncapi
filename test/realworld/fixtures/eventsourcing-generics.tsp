// =============================================================================
// Pattern Source: typespec-eventsourcing (src/types/branded-ids.tsp, events.tsp)
// Pattern: Generic models with constrained type parameters, spread of generic
//          with string literal argument, phantom brand fields, named unions,
//          3-level inheritance chains with eventType narrowing, generic event
//          data parameterization
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

// --- Generic base event with typed event data ---
model BaseEvent<TData> {
  eventId: EventId;
  aggregateId: AggregateId;
  eventType: string;
  eventVersion: int32 = 1;
  timestamp: utcDateTime;
  correlationId: CorrelationId;
  eventData: TData;
}

// --- Concrete domain events (instantiate generic with specific data type) ---
model UserCreatedEvent extends BaseEvent<{
  entityName: "User";
  initialData: {
    email: string;
    name: string;
    roles: string[];
    isActive: boolean = true;
  };
}> {
  eventType: "user.created";
}

model UserUpdatedEvent extends BaseEvent<{
  entityName: "User";
  fieldsChanged: string[];
  transitionContext: Record<string>;
}> {
  eventType: "user.updated";
}

model UserDeletedEvent extends BaseEvent<{
  entityName: "User";
  deletionReason: "self-initiated" | "admin-action" | "gdpr-request" | "inactivity";
  softDelete: boolean;
}> {
  eventType: "user.deleted";
}

// --- Snapshot event (extends BaseEvent with snapshot data) ---
model AggregateSnapshotEvent extends BaseEvent<{
  aggregateType: string;
  aggregateVersion: int64;
  eventsSinceLastSnapshot: int32;
  snapshotData: unknown;
  compressionType: "gzip" | "lz4" | "none" = "none";
}> {
  eventType: "aggregate.snapshot";
}

// --- Command base model ---
model BaseCommand {
  commandId: CommandId;
  commandType: string;
  commandVersion: string = "1.0.0";
  timestamp: utcDateTime;
  correlationId: CorrelationId;
  commandData: Record<unknown>;
}

model CreateUserCommand extends BaseCommand {
  commandType: "user.create";
  commandData: {
    email: string;
    name: string;
    roles: string[];
  };
}

model UpdateUserCommand extends BaseCommand {
  commandType: "user.update";
  commandData: {
    userId: string;
    fieldsToUpdate: Record<unknown>;
  };
}

// --- Error details ---
model ErrorDetails {
  code: string;
  message: string;
  details: Record<string>;
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

@doc("Subscribe to create user commands")
@channel("commands.user.create")
@subscribe
op subscribeCreateUserCommand(): CreateUserCommand;
