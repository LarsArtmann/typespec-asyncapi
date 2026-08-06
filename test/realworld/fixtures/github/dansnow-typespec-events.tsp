/**
 * Source: DanSnow/typespec-events (packages/playground/main.tsp, 43 lines)
 * Repo:   https://github.com/DanSnow/typespec-events
 *
 * STRIPPED: @typespec-events/typespec import, @event decorator (custom)
 * KEPT (verbatim): All model definitions, property types, nested models, arrays
 */
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Event Tracking API" })
@apiVersion("1.0.0")
@server("main", #{
  url: "events.example.com",
  protocol: "kafka",
  description: "Event tracking broker"
})
namespace EventTracking;

model UserSignedUpEvent {
  userId: string;
  timestamp: int64;

  @doc("User email")
  email: string;
}

model ProductViewedEvent {
  productId: string;
  userId?: string;
  timestamp: int64;
}

model Address {
  street: string;
  city: string;
  zipCode: string;
}

model UserAddressUpdatedEvent {
  userId: string;
  oldAddress?: Address;
  newAddress: Address;
}

model CartItem {
  name: string;
  amount: int32;
}

model CartItemsAdded {
  items: CartItem[];
}

@channel("user.signed_up")
@publish
op publishUserSignedUp(payload: UserSignedUpEvent): void;

@channel("product.viewed")
@publish
op publishProductViewed(payload: ProductViewedEvent): void;

@channel("user.address_updated")
@publish
op publishAddressUpdated(payload: UserAddressUpdatedEvent): void;

@channel("cart.items_added")
@publish
op publishCartItemsAdded(payload: CartItemsAdded): void;
