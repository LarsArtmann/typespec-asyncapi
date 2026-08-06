import { compileAsyncAPI } from "./utils/test-helpers.js";

it("debug: combined output", async () => {
  const source = `
      @server("production", #{
        url: "{broker}.kafka.example.com:9092",
        protocol: "kafka",
        protocolVersion: "3.0.0",
        variables: #{
          broker: #{
            values: #["broker1", "broker2"],
            default: "broker1"
          }
        },
        description: "Kafka cluster"
      })
      @defaultContentType("application/json")
      namespace Complete;
      model OrderPlaced {
        orderId: string;
        total: float64;
      }
      @channel("orders.placed")
      @useChannelServer("production")
      @publish
      @operationSecurity(#{ name: "jwt" })
      op publishOrderPlaced(): OrderPlaced;
    `;
  const result = await compileAsyncAPI(source);
  const fullDoc = JSON.stringify(result.asyncApiDoc, null, 2);
  throw new Error(`DOC:${fullDoc}`);
});
