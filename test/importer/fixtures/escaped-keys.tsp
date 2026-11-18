import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Example \"quoted\" \${name} \\" })
@apiVersion("2")
namespace Custom_Namespace;

@messageId("new")
@message(#{})
model event__payload {
  @jsonSchemaExtension("default", "")
  @doc("Literal */ \${value}")
  `hello-world`: string | null;

  @jsonSchemaExtension("default", 0)
  count?: integer;

  @jsonSchemaExtension("minItems", 1)
  labels?: string[];

  counts?: Record<integer>;
}

@publish
@channel("events/~new")
@operationId("send-event")
op send_event(): event__payload;
