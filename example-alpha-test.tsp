import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@asyncapi({
  info: {
    title: "Alpha Test API",
    version: "0.0.1",
    description: "Basic test for Alpha v0.0.1 release validation"
  }
})
namespace AlphaTest;

/**
 * Test user model for Alpha validation
 */
model TestUser {
  id: string;
  name: string; 
  email: string;
  createdAt: utcDateTime;
  isActive: boolean;
}

/**
 * Basic channel test - user creation events
 */
@channel("user.created")
@publish
op publishUserCreated(): TestUser;

/**
 * Basic channel test - user updates  
 */
@channel("user.updated")
@subscribe  
op subscribeToUserUpdates(): TestUser;

/**
 * Server configuration test
 */
@server("development", #{
  url: "localhost:9092", 
  protocol: "kafka",
  description: "Development Kafka server"
})
namespace AlphaTestServers {}