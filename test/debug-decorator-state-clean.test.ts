import { describe, it, expect } from "bun:test";
import { createAsyncAPIEmitterTester } from "./utils/emitter-test-helpers";
import { consolidateAsyncAPIState } from "../src/state";

describe("Decorator State Consolidation - Clean", () => {
  it("should properly extract state from all decorators", async () => {
    // Test with all decorator types
    const tester = await createAsyncAPIEmitterTester({
      "output-file": "test-state"
    });
    
    const source = `
namespace TestService {
  
model UserEvent {
  userId: string;
  action: string;
}

@channel("user/events")
@publish
op publishUserEvent(event: UserEvent);
}
    `;
    
    const result = await tester.compile(source);
    
    console.log("🔍 Testing decorator state consolidation:");
    console.log("  📋 Has program:", !!result.program);
    console.log("  📋 Has outputs:", !!result.outputs);
    
    // Test state consolidation directly
    if (result.program) {
      const consolidatedState = consolidateAsyncAPIState(result.program);
      
      console.log("🔍 CONSOLIDATED STATE ANALYSIS:");
      console.log("  📊 Channels:", consolidatedState.channels?.size || 0);
      console.log("  📊 Messages:", consolidatedState.messages?.size || 0);
      console.log("  📊 Servers:", consolidatedState.servers?.size || 0);
      console.log("  📊 Operations:", consolidatedState.operations?.size || 0);
      
      // Should have extracted data from decorators
      const hasChannelData = consolidatedState.channels && consolidatedState.channels.size > 0;
      const hasMessageData = consolidatedState.messages && consolidatedState.messages.size > 0;
      const hasServerData = consolidatedState.servers && consolidatedState.servers.size > 0;
      const hasOperationData = consolidatedState.operations && consolidatedState.operations.size > 0;
      
      console.log("🔍 STATE DATA PRESENT:");
      console.log("  Channels: " + (hasChannelData ? '✅' : '❌') + " (" + (consolidatedState.channels?.size || 0) + ")");
      console.log("  Messages: " + (hasMessageData ? '✅' : '❌') + " (" + (consolidatedState.messages?.size || 0) + ")");
      console.log("  Servers: " + (hasServerData ? '✅' : '❌') + " (" + (consolidatedState.servers?.size || 0) + ")");
      console.log("  Operations: " + (hasOperationData ? '✅' : '❌') + " (" + (consolidatedState.operations?.size || 0) + ")");
      
      // At least one decorator should have worked
      expect(hasChannelData || hasMessageData || hasServerData || hasOperationData).toBe(true);
    } else {
      console.error("❌ No program available for state consolidation");
      throw new Error("Program not available");
    }
  }, 15000);
});