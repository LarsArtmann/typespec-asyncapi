/**
 * Decorator Registration Test
 * 
 * This test verifies that our AsyncAPI decorators are properly registered
 * and can be used in TypeSpec compilation without "Unknown decorator" errors
 */

import { describe, it, expect } from "vitest"
import { compileTypeSpecWithDecorators } from "./utils/test-helpers.js"

describe("Decorator Registration System", () => {
  it("should register @channel decorator without errors", async () => {
    const { program, diagnostics } = await compileTypeSpecWithDecorators(`
      model UserEvent {
        userId: string;
        action: string;
      }
      
      @channel("user.events")
      op publishUserEvent(): UserEvent;
    `)
    
    // Should have no "Unknown decorator" errors
    const unknownDecoratorErrors = diagnostics.filter(d => 
      d.message?.includes("Unknown decorator") || 
      d.message?.includes("@channel")
    )
    
    expect(unknownDecoratorErrors).toHaveLength(0)
    expect(program).toBeDefined()
    console.log("✅ @channel decorator registered successfully")
  })

  it("should register @publish decorator without errors", async () => {
    const { program, diagnostics } = await compileTypeSpecWithDecorators(`
      model Event {
        id: string;
        data: string;
      }
      
      @channel("events")
      @publish
      op publishEvent(): Event;
    `)
    
    const unknownDecoratorErrors = diagnostics.filter(d => 
      d.message?.includes("Unknown decorator") || 
      d.message?.includes("@publish")
    )
    
    expect(unknownDecoratorErrors).toHaveLength(0)
    expect(program).toBeDefined()
    console.log("✅ @publish decorator registered successfully")
  })

  it("should register @subscribe decorator without errors", async () => {
    const { program, diagnostics } = await compileTypeSpecWithDecorators(`
      model Event {
        id: string;
        data: string;
      }
      
      @channel("events")
      @subscribe
      op subscribeToEvents(): Event;
    `)
    
    const unknownDecoratorErrors = diagnostics.filter(d => 
      d.message?.includes("Unknown decorator") || 
      d.message?.includes("@subscribe")
    )
    
    expect(unknownDecoratorErrors).toHaveLength(0)
    expect(program).toBeDefined()
    console.log("✅ @subscribe decorator registered successfully")
  })

  it("should register @server decorator without errors", async () => {
    const { program, diagnostics } = await compileTypeSpecWithDecorators(`
      @server("dev", "amqp://localhost:5672", "amqp")
      namespace TestAPI {
        model Event {
          id: string;
        }
      }
    `)
    
    const unknownDecoratorErrors = diagnostics.filter(d => 
      d.message?.includes("Unknown decorator") || 
      d.message?.includes("@server")
    )
    
    expect(unknownDecoratorErrors).toHaveLength(0)
    expect(program).toBeDefined()
    console.log("✅ @server decorator registered successfully")
  })

  it("should register all AsyncAPI decorators together", async () => {
    const { program, diagnostics } = await compileTypeSpecWithDecorators(`
      @server("dev", "amqp://localhost:5672", "amqp")
      namespace TestAPI {
        @message
        model UserMessage {
          @protocol("kafka")
          userId: string;
          content: string;
        }
        
        @channel("user.messages")
        @publish
        @security("apiKey", { name: "x-api-key", in: "header" })
        op sendMessage(): UserMessage;
        
        @channel("user.notifications")
        @subscribe
        op receiveNotifications(): UserMessage;
      }
    `)
    
    const unknownDecoratorErrors = diagnostics.filter(d => 
      d.message?.includes("Unknown decorator")
    )
    
    expect(unknownDecoratorErrors).toHaveLength(0)
    expect(program).toBeDefined()
    console.log("✅ All AsyncAPI decorators registered successfully")
  })
})