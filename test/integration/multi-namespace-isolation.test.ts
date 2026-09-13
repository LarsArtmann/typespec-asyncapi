/**
 * Integration Tests: Multi-Namespace Isolation
 *
 * Verifies that servers, security, bindings, and tags defined on different
 * namespaces do not cross-contaminate when compiled in the same document.
 */

import { inlineObject } from "../utils/type-guards.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";

describe("integration: multi-namespace isolation", () => {
  it("keeps server bindings isolated per namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("broker-a", #{
        url: "mqtt://broker-a.example.com:1883",
        protocol: "mqtt"
      })
      @bindings(#{
        mqtt: #{ clientId: "ns-a-client", bindingVersion: ${LATEST_BINDING_VERSIONS.mqtt} }
      })
      namespace NamespaceA {
        model EventA { id: string; }
        @channel("events/a") op publishA(): EventA;
      }

      @server("broker-b", #{
        url: "mqtt://broker-b.example.com:1883",
        protocol: "mqtt"
      })
      @bindings(#{
        mqtt: #{ clientId: "ns-b-client", bindingVersion: ${LATEST_BINDING_VERSIONS.mqtt} }
      })
      namespace NamespaceB {
        model EventB { id: string; }
        @channel("events/b") op publishB(): EventB;
      }
    `);

    // Both servers present
    expect(doc.servers!["broker-a"]).toBeDefined();
    expect(doc.servers!["broker-b"]).toBeDefined();

    // Namespace A server has its own mqtt binding
    const nsABindings = inlineObject(doc.servers!["broker-a"].bindings, "bindings");
    expect(nsABindings.mqtt).toBeDefined();
    expect(nsABindings.mqtt.clientId).toBe("ns-a-client");

    // Namespace B server has its own mqtt binding
    const nsBBindings = inlineObject(doc.servers!["broker-b"].bindings, "bindings");
    expect(nsBBindings.mqtt).toBeDefined();
    expect(nsBBindings.mqtt.clientId).toBe("ns-b-client");
  });

  it("keeps security schemes isolated per namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "ns-a-auth",
        scheme: #{ type: "userPassword", description: "NS A credentials" }
      })
      namespace NamespaceA {
        model EventA { id: string; }
        @channel("events/a") op publishA(): EventA;
      }

      @security(#{
        name: "ns-b-auth",
        scheme: #{ type: "scramSha256", description: "NS B credentials" }
      })
      namespace NamespaceB {
        model EventB { id: string; }
        @channel("events/b") op publishB(): EventB;
      }
    `);

    // Both security schemes present
    expect(doc.components?.securitySchemes?.["ns-a-auth"]).toBeDefined();
    expect(doc.components?.securitySchemes?.["ns-b-auth"]).toBeDefined();

    // Correct types
    expect(inlineObject(doc.components!.securitySchemes!["ns-a-auth"], "security scheme").type).toBe(
      "userPassword",
    );
    expect(inlineObject(doc.components!.securitySchemes!["ns-b-auth"], "security scheme").type).toBe(
      "scramSha256",
    );
  });

  it("keeps operation tags isolated per namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace NamespaceA {
        model EventA { id: string; }
        @channel("events/a")
        @tags(#["ns-a-only"])
        op publishA(): EventA;
      }

      namespace NamespaceB {
        model EventB { id: string; }
        @channel("events/b")
        @tags(#["ns-b-only"])
        op publishB(): EventB;
      }
    `);

    // Both channels present with correct tags
    const channelA = doc.channels!["events/a"];
    const channelB = doc.channels!["events/b"];
    expect(channelA).toBeDefined();
    expect(channelB).toBeDefined();

    // Channel A has ns-a-only tag, not ns-b-only
    expect(channelA.tags?.[0]?.name).toBe("ns-a-only");
    expect(channelA.tags?.some((t) => t.name === "ns-b-only")).toBeFalsy();

    // Channel B has ns-b-only tag, not ns-a-only
    expect(channelB.tags?.[0]?.name).toBe("ns-b-only");
    expect(channelB.tags?.some((t) => t.name === "ns-a-only")).toBeFalsy();
  });
});
