/**
 * Source: Azure/azure-rest-api-specs (specification/eventgrid/data-plane/EventGridNamespace/main.tsp, 352 lines)
 * Repo:   https://github.com/Azure/azure-rest-api-specs
 *
 * Enterprise-grade event-driven spec from Azure EventGrid Namespace.
 * Implements CloudEvents 1.0 schema.
 *
 * STRIPPED: @typespec/http, @typespec/rest, @typespec/versioning, @azure-tools/typespec-azure-core imports;
 *           @useAuth, @server (HTTP), @action, @sharedRoute, @bodyRoot, @header("content-type"),
 *           @query, @key, @resource, @parentResource decorators; StandardOperations templates;
 *           #suppress directives; using TypeSpec.Http/Rest/Versioning/Azure.Core
 *
 * KEPT (verbatim): All model definitions, CloudEvent schema, BrokerProperties,
 *                  ReceiveDetails, ReceiveResult, FailedLockToken, AcknowledgeResult,
 *                  ReleaseResult, RejectResult, union ReleaseDelay, alias types,
 *                  unknown/bytes types, @visibility, @minValue, @maxValue, @encode
 */
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Azure Messaging EventGrid Client" })
@apiVersion("2024-06-01")
@server("main", #{
  url: "eventgrid.azure.net:9093",
  protocol: "kafka",
  description: "Azure EventGrid Namespace broker"
})
namespace Microsoft.EventGrid;

model CloudEvent {
  id: string;
  source: string;
  data?: unknown;
  data_base64?: bytes;
  type: string;
  time?: utcDateTime;
  specversion: string;
  dataschema?: string;
  datacontenttype?: string;
  subject?: string;
}

model BrokerProperties {
  lockToken: string;
  deliveryCount: int32;
}

model ReceiveDetails {
  brokerProperties: BrokerProperties;
  event: CloudEvent;
}

model ReceiveResult {
  value: ReceiveDetails[];
}

model FailedLockToken {
  lockToken: string;
  error: ErrorModel;
}

model ErrorModel {
  code: string;
  message: string;
  target?: string;
  details?: ErrorModel[];
}

union ReleaseDelay {
  string,
  By0Seconds: "0",
  By10Seconds: "10",
  By60Seconds: "60",
  By600Seconds: "600",
  By3600Seconds: "3600",
}

model PublishResult {}

model AcknowledgeResult {
  failedLockTokens: FailedLockToken[];
  succeededLockTokens: string[];
}

model ReleaseResult {
  failedLockTokens: FailedLockToken[];
  succeededLockTokens: string[];
}

model RejectResult {
  failedLockTokens: FailedLockToken[];
  succeededLockTokens: string[];
}

model Topic {
  topicName: string;
}

model EventSubscription {
  eventSubscriptionName: string;
}

@channel("microsoft.eventgrid.cloud-events")
@publish
op publishCloudEvent(payload: CloudEvent): void;

@channel("microsoft.eventgrid.cloud-events")
@subscribe
op receiveCloudEvent(payload: ReceiveResult): void;

@channel("microsoft.eventgrid.acknowledge")
@publish
op acknowledgeEvents(payload: AcknowledgeResult): void;

@channel("microsoft.eventgrid.release")
@publish
op releaseEvents(payload: ReleaseResult): void;

@channel("microsoft.eventgrid.reject")
@publish
op rejectEvents(payload: RejectResult): void;
