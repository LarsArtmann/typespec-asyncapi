/**
 * Reusable Components — the components.* moat showcase.
 *
 * Demonstrates: @operationTrait + @useOperationTrait, @messageTrait +
 * @useMessageTrait, @parameter with channel address templating,
 * @reusableCorrelationId + @useCorrelationId, @reusableBinding +
 * @useBinding, @useChannelServer.
 */
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service(#{ title: "Telemetry Platform API" })
@apiVersion("3.0.0")
@server("telemetry-prod", #{
  url: "telemetry.example.com:9092",
  protocol: "kafka",
  description: "Production telemetry broker"
})
@server("telemetry-eu", #{
  url: "telemetry-eu.example.com:9092",
  protocol: "kafka",
  description: "EU region broker"
})
@operationTrait("standard-publish", #{
  summary: "Standard publish operation",
  description: "All publishes bind producer defaults."
})
@messageTrait("telemetry-envelope", #{
  description: "Every telemetry message carries a correlation id."
})
@reusableCorrelationId("tenant-correlation", "$message.header#/x-correlation-id")
@reusableBinding("producer-defaults", #{
  kafka: #{
    groupId: #{ type: "string" }
  }
})
@parameter("deviceId", #{
  description: "The device the metric belongs to.",
  location: "$message.payload#/deviceId"
})
namespace Telemetry;

@useMessageTrait("telemetry-envelope")
@useCorrelationId("tenant-correlation")
model MetricReading {
  deviceId: string;
  metric: string;
  value: float64;
  recordedAt: utcDateTime;
}

@doc("Publish a device metric reading.")
@channel("telemetry/metrics/{deviceId}")
@publish
@useOperationTrait("standard-publish")
@useBinding("producer-defaults")
@useChannelServer("telemetry-eu")
op publishMetric(): MetricReading;

@doc("Ingest pre-aggregated rollups (uses the default producer server).")
@channel("telemetry/rollups")
@publish
@useOperationTrait("standard-publish")
@useBinding("producer-defaults")
op publishRollup(): MetricReading;
