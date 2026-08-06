/**
 * Adapted fixture: DanSnow/typespec-events → AsyncAPI
 *
 * Source: https://github.com/DanSnow/typespec-events
 *
 * The original repo is an event-tracking library using a custom
 * `@typespec-events/typespec` package with `@event` decorator.
 * This adapted fixture extracts the REAL MODELS verbatim and wraps them
 * in AsyncAPI channel/publish operations.
 *
 * Patterns tested:
 * - int64 timestamps
 * - Nested model references ($ref)
 * - Arrays of named models (CartItem[])
 * - Optional properties
 * - @doc decorator
 */

import { compileAsyncAPI } from "../../utils/test-helpers.js";

describe("adapted: DanSnow/typespec-events", () => {
  const source = `
    import "@lars-artmann/typespec-asyncapi";
    using TypeSpec.AsyncAPI;

    namespace EventTracking;

    @doc("User signed up")
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
    op userSignedUp(): UserSignedUpEvent;

    @channel("product.viewed")
    @publish
    op productViewed(): ProductViewedEvent;

    @channel("user.address_updated")
    @publish
    op addressUpdated(): UserAddressUpdatedEvent;

    @channel("cart.items_added")
    @publish
    op cartItemsAdded(): CartItemsAdded;
  `;

  it("compiles without errors", async () => {
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("emits int64 as integer with int64 format", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.UserSignedUpEvent;
    expect(evt?.properties?.timestamp).toMatchObject({
      type: "integer",
      format: "int64",
    });
  });

  it("applies @doc as description on model and property", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.UserSignedUpEvent;
    expect(evt?.description).toContain("User signed up");
    expect(evt?.properties?.email?.description).toContain("User email");
  });

  it("emits nested model as $ref", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.UserAddressUpdatedEvent;
    expect(evt?.properties?.newAddress).toMatchObject({
      $ref: "#/components/schemas/Address",
    });
    expect(evt?.properties?.oldAddress).toMatchObject({
      $ref: "#/components/schemas/Address",
    });
    expect(evt?.required).toContain("newAddress");
    expect(evt?.required).not.toContain("oldAddress");
  });

  it("emits array of named model with items $ref", async () => {
    const result = await compileAsyncAPI(source);
    const evt = result.asyncApiDoc?.components?.schemas?.CartItemsAdded;
    expect(evt?.properties?.items).toMatchObject({
      type: "array",
      items: { $ref: "#/components/schemas/CartItem" },
    });
  });

  it("registers all models in components.schemas", async () => {
    const result = await compileAsyncAPI(source);
    const schemas = result.asyncApiDoc?.components?.schemas;
    expect(schemas?.Address).toBeDefined();
    expect(schemas?.CartItem).toBeDefined();
    expect(schemas?.UserSignedUpEvent).toBeDefined();
    expect(schemas?.ProductViewedEvent).toBeDefined();
    expect(schemas?.UserAddressUpdatedEvent).toBeDefined();
    expect(schemas?.CartItemsAdded).toBeDefined();
  });

  it("produces 4 channels and 4 operations", async () => {
    const result = await compileAsyncAPI(source);
    const channels = Object.keys(result.asyncApiDoc?.channels ?? {});
    const operations = Object.keys(result.asyncApiDoc?.operations ?? {});
    expect(channels).toHaveLength(4);
    expect(operations).toHaveLength(4);
  });
});
