import { PerformanceError } from "./PerformanceError.js";

export class MetricsCollectionError extends PerformanceError {
  readonly _tag = "MetricsCollectionError";
  override readonly name = "MetricsCollectionError";
}
