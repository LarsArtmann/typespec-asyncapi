import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("production", #{
  url: "api.example.com",
  protocol: "https",
  description: "Production server"
})
namespace MultiChannel;

model UserSignup {
  userId: string;
  email: string;
  timestamp: utcDateTime;
}

model OrderCreated {
  orderId: string;
  userId: string;
  total: decimal;
}

model PaymentProcessed {
  paymentId: string;
  orderId: string;
  amount: decimal;
  status: "success" | "failed";
}

@channel("users.signup")
@publish
op publishUserSignup(): UserSignup;

@channel("orders.created")
@publish
op publishOrderCreated(): OrderCreated;

@channel("orders.created")
@subscribe
op subscribeOrderCreated(): OrderCreated;

@channel("payments.processed")
@publish
op publishPaymentProcessed(): PaymentProcessed;

@channel("payments.processed")
@subscribe
op subscribePaymentProcessed(): PaymentProcessed;
