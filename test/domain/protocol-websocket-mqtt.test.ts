/**
 * WebSocket & MQTT Protocol Binding Tests
 *
 * Table-driven replacement for the former 1515-line fake-assertion file:
 * every test asserts real binding keys, values, normalization, and
 * placement against the spec-derived matrix (ws: channel only;
 * mqtt: server/operation/message) and validates output against the
 * official AsyncAPI 3.1.0 JSON Schema.
 */

import {
  compileAndValidate,
  compileAndValidateOrThrow,
} from "../utils/schema-validator.js";
import type {
  OperationObject,
  ParsedAsyncAPIDocument,
} from "../../src/domain/models/asyncapi-document.js";

function opOf(doc: ParsedAsyncAPIDocument): OperationObject {
  return Object.values(doc.operations!)[0];
}

describe("webSocket & MQTT binding normalization", () => {
  it("normalizes server protocol 'websocket' to 'ws'", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("ws", #{ url: "wss://api.example.com/ws", protocol: "websocket" })
      namespace Test;
      model Msg { data: string; }
      @channel("messages")
      op send(): Msg;
    `);
    expect(doc.servers!.ws.protocol).toBe("ws");
  });

  it("keeps 'wss' distinct at the server level", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("secure", #{ url: "wss://api.example.com/ws", protocol: "wss" })
      namespace Test;
      model Msg { data: string; }
      @channel("messages")
      op send(): Msg;
    `);
    expect(doc.servers!.secure.protocol).toBe("wss");
  });

  it("uses the 'ws' binding key for 'websocket' @protocol configs", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("ws.channel")
      @protocol(#{
        protocol: "websocket",
        method: "GET",
        query: #{ token: #{ type: "string" } }
      })
      op send(): Msg;
    `);
    const { bindings } = doc.channels!["ws.channel"];
    expect(bindings!.ws).toBeDefined();
    expect(bindings!.websocket).toBeUndefined();
    expect(bindings!.ws.method).toBe("GET");
  });

  it("normalizes 'wss' to the 'ws' binding key", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("wss.channel")
      @protocol(#{
        protocol: "wss",
        headers: #{ authorization: #{ type: "string" } }
      })
      op send(): Msg;
    `);
    const { bindings } = doc.channels!["wss.channel"];
    expect(bindings!.ws).toBeDefined();
    expect(bindings!.wss).toBeUndefined();
  });

  it("normalizes 'mqtt5' to the 'mqtt' binding key", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("sensor")
      @bindings(#{ mqtt5: #{ retain: true } })
      op send(): Msg;
    `);
    const { mqtt } = opOf(doc).bindings!;
    expect(mqtt).toBeDefined();
    expect(mqtt.retain).toBe(true);
  });
});

describe("webSocket & MQTT bindingVersion injection", () => {
  it("auto-injects ws channel bindingVersion 0.1.0", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("events")
      @protocol(#{ protocol: "ws", method: "POST" })
      op send(): Msg;
    `);
    expect(doc.channels!.events.bindings!.ws.bindingVersion).toBe("0.1.0");
  });

  it("auto-injects mqtt operation bindingVersion 0.2.0", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("sensor")
      @bindings(#{ mqtt: #{ retain: true } })
      op send(): Msg;
    `);
    expect(opOf(doc).bindings!.mqtt.bindingVersion).toBe("0.2.0");
  });

  it("preserves an explicit bindingVersion", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("events")
      @protocol(#{
        protocol: "ws",
        binding: #{ bindingVersion: "0.1.0", method: "GET" }
      })
      op send(): Msg;
    `);
    const { ws } = doc.channels!.events.bindings!;
    expect(ws.bindingVersion).toBe("0.1.0");
    expect(ws.method).toBe("GET");
  });
});

describe("mQTT binding fields", () => {
  it("emits qos and retain on the operation binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Reading { value: float64; }
      @channel("sensor/readings")
      @bindings(#{
        mqtt: #{
          qos: 1,
          retain: true
        }
      })
      op publish(): Reading;
    `);
    const { mqtt } = opOf(doc).bindings!;
    expect(mqtt.qos).toBe(1);
    expect(mqtt.retain).toBe(true);
  });

  it("emits server bindings from namespace-level @bindings", async () => {
    const doc = await compileAndValidateOrThrow(`
      @bindings(#{
        mqtt: #{
          clientId: "telemetry-1",
          cleanSession: false,
          keepAlive: 30
        }
      })
      @server("broker", #{ url: "mqtt://localhost:1883", protocol: "mqtt" })
      namespace Test;
      model Reading { value: float64; }
      @channel("readings")
      op publish(): Reading;
    `);
    const { mqtt } = doc.servers!.broker.bindings!;
    expect(mqtt.clientId).toBe("telemetry-1");
    expect(mqtt.cleanSession).toBeFalsy();
    expect(mqtt.keepAlive).toBe(30);
    expect(mqtt.bindingVersion).toBe("0.2.0");
  });

  it("emits message bindings from @bindings on the payload model", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @bindings(#{ mqtt: #{ contentType: "application/json" } })
      model Reading { value: float64; }
      @channel("readings")
      op publish(): Reading;
    `);
    const { Reading: message } = doc.components!.messages!;
    const { mqtt } = message.bindings!;
    expect(mqtt.contentType).toBe("application/json");
    expect(mqtt.bindingVersion).toBe("0.2.0");
  });
});

describe("webSocket & MQTT placement matrix", () => {
  it("places ws fields (method/query/headers) on the channel binding only", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("chat")
      @protocol(#{
        protocol: "ws",
        method: "POST",
        query: #{ room: #{ type: "string" } },
        headers: #{ xTrace: #{ type: "string" } }
      })
      op send(): Msg;
    `);
    const { ws } = doc.channels!.chat.bindings!;
    expect(ws.method).toBe("POST");
    expect(ws.query).toStrictEqual({ room: { type: "string" } });
    expect(ws.headers).toStrictEqual({ xTrace: { type: "string" } });
    expect(opOf(doc).bindings).toBeUndefined();
  });

  it("warns on ws bindings misplaced at the operation placement", async () => {
    const result = await compileAndValidate(`
      namespace Test;
      model Msg { data: string; }
      @channel("chat")
      @bindings(#{ ws: #{ method: "POST" } })
      op send(): Msg;
    `);
    expect(result.valid).toBe(true);
    const misplaced = result.diagnostics.filter(
      (d) => d.code === "@lars-artmann/typespec-asyncapi/misplaced-binding",
    );
    expect(misplaced.length).toBeGreaterThan(0);
  });

  it("routes raw mqtt binding passthrough to the operation (mqtt has no channel binding)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Msg { data: string; }
      @channel("sensor")
      @protocol(#{
        protocol: "mqtt",
        binding: #{ retain: false }
      })
      op send(): Msg;
    `);
    expect(doc.channels!.sensor.bindings).toBeUndefined();
    expect(opOf(doc).bindings!.mqtt.retain).toBeFalsy();
  });
});
