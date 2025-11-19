import type { DecoratorContext, Operation } from "@typespec/compiler";
import { reportDiagnostic } from "../../lib.js";
import { Effect } from "effect";
import { checkOperationTypeConflict } from "./publish.js";

//TODO: CRITICAL - Add AsyncAPI 3.0.0 Subscribe Operation Object compliance validation
//TODO: CRITICAL - Implement proper Effect.TS Result/Either types for error handling
//TODO: CRITICAL - Add message schema validation for subscribe operations
//TODO: CRITICAL - Validate operation binding support (HTTP, WebSocket, Kafka, AMQP)
//TODO: CRITICAL - Add correlation ID pattern validation for request-reply
//TODO: CRITICAL - Implement operation security scheme validation
//TODO: CRITICAL - Add operation tags and external documentation support
//TODO: CRITICAL - Add support for subscribe operation options (message filtering, etc.)
//TODO: CRITICAL - Implement AsyncAPI 3.0.0 action validation ("receive" for subscribe operations)

export function $subscribe(context: DecoratorContext, target: Operation): void {
  Effect.log(`= PROCESSING @subscribe decorator on operation: ${target.name}`);
  Effect.log(`🔽 Target type: ${target.kind}`);

  //TODO: CRITICAL - This validation is redundant - TypeScript ensures target is Operation
  if (target.kind !== "Operation") {
    //TODO: CRITICAL - Wrong diagnostic type - should be operation-type-mismatch not invalid-channel-path
    reportDiagnostic(context, target, "invalid-channel-path", {
      path: "@subscribe can only be applied to operations",
    });
    return;
  }

  //TODO: CRITICAL - Missing validation: operation must have appropriate input/output message schemas
  // Check for operation type conflicts and set type
  if (checkOperationTypeConflict(context, target, "subscribe", "publish")) {
    return;
  }

  //TODO: CRITICAL - Need to validate that operation has appropriate message schema for subscription
  //TODO: CRITICAL - Should store additional subscribe-specific metadata (message filters, etc.)
  //TODO: CRITICAL - Remove debug logging from production decorator

  Effect.log(
    `✅ Successfully marked operation ${target.name} as subscribe operation`,
  );
}
