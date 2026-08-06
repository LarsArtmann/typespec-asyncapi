// =============================================================================
// Canonical AsyncAPI Spec: Streetlights API
//
// The canonical AsyncAPI example — MQTT pub/sub for smart city streetlights.
// A faithful port of the AsyncAPI Streetlights example to TypeSpec.
//
// Real-world patterns: MQTT protocol, pub/sub, request/reply, multiple
// message types per channel, parameterized channel addresses, enums.
// =============================================================================

@service(#{ title: "Streetlights API", version: "1.0.0" })
@server("production", #{ url: "api.streetlights.smartcity.com:8883", protocol: "mqtt" })
@server("staging", #{ url: "staging.streetlights.smartcity.com:1883", protocol: "mqtt" })
@defaultContentType("application/json")
namespace StreetlightsAPI;

// --- Enums ---
enum LightMeasurementUnit {
  lux: "lux",
  watt: "watt",
  lumen: "lumen",
}

// --- Models ---
model LightMeasurement {
  @doc("ID of the streetlight.")
  id: int64;

  @doc("Measured light concentration.")
  lumens: int32;

  @doc("Light measurement unit.")
  unit: LightMeasurementUnit;

  @doc("Timestamp of the measurement.")
  @format("date-time")
  sentAt: string;
}

model DimLightRequest {
  @doc("Percentage of the maximum light intensity.")
  @minValue(0)
  @maxValue(100)
  pwmDutyCycle: int32;

  @doc("Timestamp of the command.")
  sentAt: string;
}

model TurnOnOffRequest {
  @doc("Whether the light should be turned on or off.")
  commandedState: "on" | "off";

  @doc("Timestamp of the command.")
  sentAt: string;
}

// --- Operations ---
@doc("Inform about environmental lighting conditions of a particular streetlight.")
@channel("smart.streetlights.{streetlightId}.event.measurement")
@publish
op publishLightMeasurement(streetlightId: string): LightMeasurement;

@doc("Subscribe to environmental lighting conditions of a particular streetlight.")
@channel("smart.streetlights.{streetlightId}.event.measurement")
@subscribe
op subscribeLightMeasurement(streetlightId: string): LightMeasurement;

@doc("Command a particular streetlight to turn on or off.")
@channel("smart.streetlights.{streetlightId}.command.turnon")
@publish
op publishTurnOnOff(streetlightId: string): TurnOnOffRequest;

@doc("Command a particular streetlight to dim its lights.")
@channel("smart.streetlights.{streetlightId}.command.dim")
@publish
op publishDimLight(streetlightId: string): DimLightRequest;
