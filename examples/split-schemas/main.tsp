/**
 * Split Schemas — multi-file output showcase.
 *
 * Demonstrates: split-schemas=true emitting one file per schema under
 * schemas/ with all $ref pointers rewritten to external paths, plus
 * generic models (Result<T>) as named per-argument schemas.
 */
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service(#{ title: "Catalog Events API" })
@apiVersion("1.0.0")
@server("nats", #{
  url: "nats.catalog.internal:4222",
  protocol: "nats",
  description: "Catalog event bus"
})
namespace Catalog;

model Product {
  sku: string;
  title: string;
  @minValue(0)
  price: decimal;
  tags: string[];
}

model Result<T> {
  data: T;
  requestId: string;
}

@doc("A product was added to the catalog.")
@channel("catalog.products.created")
@publish
op productCreated(): Result<Product>;

@doc("A product price changed.")
@channel("catalog.products.price-changed")
@publish
op priceChanged(): Product;
