export class ThroughputBelowTargetError extends Error {
  readonly _tag = "ThroughputBelowTargetError";
  override readonly name = "ThroughputBelowTargetError";

  constructor(
    public readonly actualThroughput: number,
    public readonly targetThroughput: number,
  ) {
    super(`Throughput below target: ${actualThroughput} < ${targetThroughput}`);
  }
}
