/**
 * Integration Tests: Namespace-scoped @bindings (server bindings)
 *
 * Verifies that @bindings applied to a Namespace attaches bindings to servers.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("integration: namespace @bindings", () => {
  it("attaches bindings to servers from namespace @bindings", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("mqtt-broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt"
      })
      @bindings(#{
        mqtt: #{
          clientId: "my-client",
          cleanSession: true
        }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers!["mqtt-broker"]).toBeDefined();
    expect(doc.servers!["mqtt-broker"].bindings).toBeDefined();
    const binding = doc.servers!["mqtt-broker"].bindings!;
    expect(binding.mqtt).toBeDefined();
    expect(binding.mqtt.clientId).toBe("my-client");
    expect(binding.mqtt.bindingVersion).toBe("0.2.0");
  });

  it("applies bindings to all servers on the namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("broker1", #{
        url: "mqtt://broker1.example.com:1883",
        protocol: "mqtt"
      })
      @server("broker2", #{
        url: "mqtt://broker2.example.com:1883",
        protocol: "mqtt"
      })
      @bindings(#{
        mqtt: #{ cleanSession: true }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.servers!.broker1.bindings).toBeDefined();
    expect(doc.servers!.broker1.bindings!.mqtt).toBeDefined();
    expect(doc.servers!.broker2.bindings).toBeDefined();
    expect(doc.servers!.broker2.bindings!.mqtt).toBeDefined();
  });

  it("does not affect operations or messages when on namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt"
      })
      @bindings(#{
        mqtt: #{ cleanSession: true }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const [op] = Object.values(doc.operations!);
    expect(op.bindings).toBeUndefined();
  });
});
