import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace PropertyDebugTest;

model TestUser {
  id: string;
  name: string;  
  age: int32;
  isActive: boolean;
}

@channel("debug.test")
@publish
op publishTestUser(): TestUser;