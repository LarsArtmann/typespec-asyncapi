/**
 * Streetlights — canonical AsyncAPI example ported to TypeSpec (MQTT).
 *
 * Demonstrates: @server with variables, @channel address templating with
 * @parameter, constraint decorators, enum payloads, publish/subscribe.
 */
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service(#{ title: "Streetlights API" })
@apiVersion("1.0.0")
@defaultContentType("application/json")
@server("mosquitto", #{
  url: "test.mosquitto.org",
  protocol: "mqtt",
  description: "Test broker",
  variables: #{
    port: #{
      description: "Secure connection (TLS) is available on port 8883.",
      default: "1883",
      values: #["1883", "8883"]
    }
  }
})
@parameter("streetlightId", #{
  description: "The ID of the streetlight.",
  location: "$message.payload#/streetlightId"
})
namespace Streetlights;

enum LightMeasurementUnit {
  lumens: "lumens";
  lux: "lux";
}

model LightMeasured {
  @minLength(1)
  streetlightId: string;

  @doc("Light intensity measured by the device.")
  @minValue(0)
  luminosity: int32;

  unit: LightMeasurementUnit;

  @doc("Date and time when the light was measured.")
  sentAt: utcDateTime;
}

model DimLight {
  @minValue(0)
  @maxValue(1000)
  lightIntensity: int32;

  sentAt: utcDateTime;
}

@doc("Inform about environmental lighting conditions for a particular streetlight.")
@channel("smartstreetlight/lighting/measured/{streetlightId}")
@publish
op receiveLightMeasurement(): LightMeasured;

@doc("Command a particular streetlight to dim the lights.")
@channel("smartstreetlight/lighting/dim/{streetlightId}")
@subscribe
op dimLight(): DimLight;
