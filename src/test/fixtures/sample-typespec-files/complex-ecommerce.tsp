import "@typespec/asyncapi";
using TypeSpec.AsyncAPI;

@doc("E-commerce event system with complex models")
namespace EcommerceEvents;

@doc("Customer information")
model Customer {
  @doc("Unique customer identifier")
  customerId: string;
  
  @doc("Customer email address")
  email: string;
  
  @doc("Customer profile")
  profile: CustomerProfile;
}

@doc("Customer profile details")
model CustomerProfile {
  @doc("First name")
  firstName: string;
  
  @doc("Last name")
  lastName: string;
  
  @doc("Customer preferences")
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    language: string;
  };
  
  @doc("Customer addresses")
  addresses: Address[];
}

@doc("Address information")
model Address {
  @doc("Street address")
  street: string;
  
  @doc("City name")
  city: string;
  
  @doc("State or province")
  state: string;
  
  @doc("Postal code")
  postalCode: string;
  
  @doc("Country code")
  country: string;
}

@doc("Order information")
@message({
  name: "OrderEvent",
  title: "Order Event Message",
  contentType: "application/json",
  correlationId: "orderId"
})
model OrderEvent {
  @doc("Order identifier")
  orderId: string;
  
  @doc("Customer information")
  customer: Customer;
  
  @doc("Order items")
  items: OrderItem[];
  
  @doc("Order total in cents")
  totalAmountCents: int64;
  
  @doc("Order status")
  status: "created" | "confirmed" | "shipped" | "delivered" | "cancelled";
  
  @doc("Order timestamp")
  createdAt: utcDateTime;
}

@doc("Order line item")
model OrderItem {
  @doc("Product SKU")
  productSku: string;
  
  @doc("Product name")
  productName: string;
  
  @doc("Quantity ordered")
  quantity: int32;
  
  @doc("Unit price in cents")
  unitPriceCents: int64;
}

@protocol({
  protocol: "kafka",
  binding: {
    topic: "order-events",
    key: "orderId",
    groupId: "order-service"
  }
})
@security({
  name: "kafkaAuth",
  scheme: {
    type: "sasl",
    mechanism: "SCRAM-SHA-256"
  }
})
@channel("orders.created")
@doc("Published when new order is created")
@publish
op publishOrderCreated(): OrderEvent;

@channel("orders.{customerId}.updates")
@doc("Subscribe to order updates for specific customer")
@subscribe
op subscribeCustomerOrderUpdates(customerId: string): OrderEvent;