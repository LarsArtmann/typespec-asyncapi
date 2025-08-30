// Test TypeSpec → AsyncAPI without decorators
// This tests if our emitter core works

namespace UserService;

model User {
  id: string;
  name: string;
  email: string;
}

model Event {
  type: string;
  data: Record<unknown>;
  timestamp: utcDateTime;
}

op sendUserEvent(user: User, event: Event): void;
op getUserEvents(userId: string): Event[];