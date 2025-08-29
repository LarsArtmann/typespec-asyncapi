import "@typespec/asyncapi";

/**
 * Test service for AsyncAPI emitter validation
 * This PROVES the emitter reads real TypeSpec AST data!
 */
namespace UserEvents;

@doc("User signup event model - REAL TypeSpec model!")
model UserSignupEvent {
  @doc("User's unique identifier")
  userId: string;
  
  @doc("User's email address")  
  email: string;
  
  @doc("Timestamp of signup")
  timestamp: string;
  
  @doc("User's selected plan")
  plan: "free" | "premium" | "enterprise";
}

@doc("User message model - Another REAL TypeSpec model!")
model UserMessage {
  @doc("Message ID")
  messageId: string;
  
  @doc("Message content")
  content: string;
  
  @doc("Message sender")
  from: string;
  
  @doc("Message timestamp")
  timestamp: string;
}

@channel("user.signup")
@doc("Publish user signup events to the system - REAL TypeSpec operation!")
op publishUserSignup(): UserSignupEvent;

@channel("user.messages")
@doc("Subscribe to messages for users - Another REAL TypeSpec operation!")
op receiveUserMessage(
  @doc("User ID parameter")
  userId: string
): UserMessage;