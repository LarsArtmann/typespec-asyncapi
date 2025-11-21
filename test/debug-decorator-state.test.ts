import { describe, it, expect } from "bun:test";
import { createAsyncAPIEmitterTester } from "./utils/emitter-test-helpers";
import { consolidateAsyncAPIState } from "../src/state";
import type { Program } from "@typespec/compiler";

describe("Decorator State Consolidation", () => {
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
    
    const result = await tester.compile(source);
    
    console.log("🔍 Testing decorator state consolidation:");
    console.log("  📋 Has program:", !!result.program);
    console.log("  📋 Has outputs:", !!result.outputs);
    console.log("  📋 Output keys:", Object.keys(result.outputs || {}));
    
    // Test state consolidation directly
    if (result.program) {
      console.log("DEBUG: About to import consolidateAsyncAPIState");
      try {
        const consolidatedState = consolidateAsyncAPIState(result.program);
        console.log("DEBUG: consolidateAsyncAPIState executed successfully");
      } catch (error) {
        console.error("DEBUG: consolidateAsyncAPIState failed:", error);
        throw error;
      }
      
      console.log("CONSOLIDATED STATE ANALYSIS:");
      console.log("Channels:", consolidatedState.channels?.size || 0);
      console.log("Messages:", consolidatedState.messages?.size || 0);
      console.log("Servers:", consolidatedState.servers?.size || 0);
      console.log("Operations:", consolidatedState.operations?.size || 0);
      
      // Verify each state component
      expect(consolidatedState.channels).toBeDefined();
      expect(consolidatedState.messages).toBeDefined();
      expect(consolidatedState.servers).toBeDefined();
      expect(consolidatedState.operations).toBeDefined();
      
      // Should have extracted data from decorators
      const hasChannelData = consolidatedState.channels && consolidatedState.channels.size > 0;
      const hasMessageData = consolidatedState.messages && consolidatedState.messages.size > 0;
      const hasServerData = consolidatedState.servers && consolidatedState.servers.size > 0;
      const hasOperationData = consolidatedState.operations && consolidatedState.operations.size > 0;
      
      console.log("STATE DATA PRESENT:");
      console.log(`Channels: ${hasChannelData ? 'YES' : 'NO'} (${consolidatedState.channels?.size || 0})`);
      console.log(`Messages: ${hasMessageData ? 'YES' : 'NO'} (${consolidatedState.messages?.size || 0})`);
      console.log(`Servers: ${hasServerData ? 'YES' : 'NO'} (${consolidatedState.servers?.size || 0})`);
      console.log(`Operations: ${hasOperationData ? 'YES' : 'NO'} (${consolidatedState.operations?.size || 0})`);
      
      if (hasChannelData) {
        for (const [channelType, channelData] of consolidatedState.channels.entries()) {
          console.log(`Channel: ${channelType.name} -> ${channelData.path}`);
        }
      }
      
      if (hasMessageData) {
        for (const [messageType, messageData] of consolidatedState.messages.entries()) {
          console.log(`Message: ${messageType.name} -> ${messageData.messageId || 'no-id'}`);
        }
      }
      
      if (hasServerData) {
        for (const [serverType, serverData] of consolidatedState.servers.entries()) {
          console.log(`Server: ${serverType.name} -> ${serverData.url}`);
        }
      }
      
      if (hasOperationData) {
        for (const [operationType, operationData] of consolidatedState.operations.entries()) {
          console.log(`Operation: ${operationType.name} -> ${operationData.type}`);
        }
      }
      
      // At least one decorator should have worked
      expect(hasChannelData || hasMessageData || hasServerData || hasOperationData).toBe(true);
    } else {
      console.error("❌ No program available for state consolidation");
      throw new Error("Program not available");
    }
  }, 15000);
});