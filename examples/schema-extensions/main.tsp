import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("development", #{
  url: "localhost:9092",
  protocol: "kafka",
  description: "Local development Kafka"
})
namespace SchemaExtensionsAPI;

/**
 * Demonstrates `@jsonSchemaExtension`: arbitrary JSON Schema validation
 * keywords on models and properties. Each keyword is emitted verbatim onto
 * the generated schema (or as a `$ref` sibling for named references).
 */
@jsonSchemaExtension("additionalProperties", false)
@jsonSchemaExtension("x-weight", 3)
model PaymentProcessedPayload {
  @jsonSchemaExtension("examples", #["pay_9f2c", "pay_1a4b"])
  @jsonSchemaExtension("pattern", "^pay_[a-z0-9]{4}$")
  paymentId: string;

  @jsonSchemaExtension("minimum", 0.01)
  @jsonSchemaExtension("multipleOf", 0.01)
  amount: float64;

  @jsonSchemaExtension("x-sensitive", true)
  cardLast4: string;
}

/**
 * Demonstrates `@encodedName`: a wire-format property key that differs from
 * the TypeSpec identifier. The emitted schema uses `Payment-Id` as the
 * property key (and in `required`), while the source stays idiomatic.
 */
model InvoiceIssuedPayload {
  @encodedName("application/json", "Payment-Id")
  paymentId: string;

  totalAmount: float64;
}

/**
 * Demonstrates `@extension`: AsyncAPI document extensions (`x-` keys) on the
 * namespace (document root), operations, and messages.
 */
@extension("x-document-owner", "payments-team")
@channel("payments.processed")
@extension("x-rate-limit", 500)
@publish
op publishPaymentProcessed(): PaymentProcessedPayload;

@channel("invoices.issued")
@extension("x-retry-policy", "exponential")
@publish
op publishInvoiceIssued(): InvoiceIssuedPayload;
