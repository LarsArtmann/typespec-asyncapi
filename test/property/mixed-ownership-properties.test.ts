/**
 * Property-Based Ownership Invariants (fast-check)
 *
 * Random mixed @typespec/http + AsyncAPI specs must satisfy:
 *  O1 no operation is listed in the AsyncAPI document AND routed by
 *     @typespec/http (no double-listing; the AsyncAPI-over-HTTP escape is
 *     not generated here)
 *  O2 every decorated event operation appears in the document
 *  O3 a bare operation under a @service namespace is excluded iff
 *     @typespec/http is loaded and decorated event ops exist
 *
 * The generator gives every operation under the service a unique @route so
 * http's duplicate-operation errors (the upstream friction) never abort
 * emission; ownership is still exact per operation.
 *
 * Reproduction: seeds are pinned via SEED below; override with FC_SEED.
 */

import fc from "fast-check";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const SEED = Number(
  // eslint-disable-next-line node/no-process-env -- FC_SEED is the documented reproduction override
  process.env["FC_SEED"] ?? 20_261_003,
);
const RUNS = 20;

interface MixedSpec {
  readonly httpLoaded: boolean;
  readonly serviceExists: boolean;
  readonly restOps: number;
  readonly eventsInside: number;
  readonly eventsOutside: number;
  readonly bareInside: number;
  readonly bareOutside: number;
  readonly channelOnlyEvents: boolean;
}

const mixedSpecArbitrary: fc.Arbitrary<MixedSpec> = fc
  .record({
    httpLoaded: fc.boolean(),
    serviceExists: fc.boolean(),
    restOps: fc.integer({ min: 0, max: 1 }),
    eventsInside: fc.integer({ min: 0, max: 2 }),
    eventsOutside: fc.integer({ min: 0, max: 2 }),
    bareInside: fc.integer({ min: 0, max: 2 }),
    bareOutside: fc.integer({ min: 0, max: 2 }),
    channelOnlyEvents: fc.boolean(),
  })
  .map((spec) =>
    spec.serviceExists
      ? spec
      : { ...spec, restOps: 0, eventsInside: 0, bareInside: 0 },
  );

function renderEventOp(name: string, spec: MixedSpec): string {
  return spec.channelOnlyEvents
    ? `@channel("/events/${name}") op ${name}(): string;`
    : `@subscribe op ${name}(): string;`;
}

function renderSpec(spec: MixedSpec): string {
  const lines: string[] = [];
  if (spec.httpLoaded) {
    lines.push('import "@typespec/http";');
  }
  lines.push(
    'import "@lars-artmann/typespec-asyncapi";',
    "",
    "using TypeSpec.AsyncAPI;",
    ...(spec.httpLoaded ? ["using TypeSpec.Http;"] : []),
    "",
    "",
  );

  if (spec.serviceExists) {
    lines.push("@service(#{title: \"Mixed\"})");
    if (spec.httpLoaded) {
      lines.push('@route("/api")');
    }
    lines.push("namespace Svc {");
    for (let i = 1; i <= spec.restOps; i++) {
      lines.push(
        ...(spec.httpLoaded
          ? ['  @route("/rest")', "  @get"]
          : []),
        `  op restOp${spec.restOps > 1 ? i : ""}(): string;`,
      );
      break;
    }
    for (let i = 1; i <= spec.eventsInside; i++) {
      lines.push(
        ...(spec.httpLoaded ? [`  @route("/ev-in-${i}")`] : []),
        renderEventOp(`evIn${i}`, spec),
      );
    }
    for (let i = 1; i <= spec.bareInside; i++) {
      lines.push(
        ...(spec.httpLoaded ? [`  @route("/bare-in-${i}")`] : []),
        `  op bareIn${i}(): string;`,
      );
    }
    lines.push("}");
  }

  const eventCount = spec.eventsInside + spec.eventsOutside;
  if (spec.eventsOutside > 0) {
    lines.push(
      '@TypeSpec.AsyncAPI.server("Prod", #{',
      '  url: "events.example.com",',
      '  protocol: "wss",',
      "})",
      "namespace Evt {",
    );
    for (let i = 1; i <= spec.eventsOutside; i++) {
      lines.push(renderEventOp(`evOut${i}`, spec));
    }
    lines.push("}");
  }

  if (spec.bareOutside > 0) {
    lines.push("namespace Outside {");
    for (let i = 1; i <= spec.bareOutside; i++) {
      lines.push(`  op bareOut${i}(): string;`);
    }
    lines.push("}");
  }

  // Silence the unused-variable lint when no events were generated.
  if (eventCount === 0 && spec.bareOutside === 0 && !spec.serviceExists) {
    lines.push("model Unused { value: string; }");
  }
  return lines.join("\n");
}

function expectedChannels(spec: MixedSpec): string[] {
  const decoratedOps = spec.eventsInside + spec.eventsOutside;
  const channels: string[] = [];
  for (let i = 1; i <= spec.eventsInside; i++) {
    channels.push(
      spec.channelOnlyEvents ? `/events/evIn${i}` : `evIn${i}`,
    );
  }
  for (let i = 1; i <= spec.eventsOutside; i++) {
    channels.push(
      spec.channelOnlyEvents ? `/events/evOut${i}` : `evOut${i}`,
    );
  }
  for (let i = 1; i <= spec.bareInside; i++) {
    // O3: excluded iff http is loaded and decorated event ops exist.
    if (!(spec.httpLoaded && decoratedOps > 0)) {
      channels.push(`bareIn${i}`);
    }
  }
  for (let i = 1; i <= spec.bareOutside; i++) {
    channels.push(`bareOut${i}`);
  }
  for (let i = 1; i <= spec.restOps; i++) {
    // O3 for the decorated-REST op: pure minimal specs (no events) emit it.
    if (!(spec.httpLoaded && decoratedOps > 0)) {
      channels.push(spec.restOps > 1 ? `restOp${i}` : "restOp");
    }
  }
  return channels.toSorted();
}

describe("property: mixed-emitter ownership invariants", () => {
  it(
    "random mixed specs: channels == decorated events + unclaimed bare ops",
    async () => {
      await fc.assert(
        fc.asyncProperty(mixedSpecArbitrary, async (spec) => {
          const { asyncApiDoc, diagnostics } = await compileAsyncAPI(
            renderSpec(spec),
          );
          const actual = Object.keys(asyncApiDoc?.channels ?? {}).toSorted();
          expect(actual).toStrictEqual(expectedChannels(spec));

          const countByCode = (code: string): number =>
            diagnostics.filter((d) => d.code?.endsWith(code)).length;

          // O1 complement: every excluded bare op is signaled.
          const excludedCount =
            spec.bareInside * (spec.httpLoaded && spec.eventsInside + spec.eventsOutside > 0 ? 1 : 0) +
            spec.restOps * (spec.httpLoaded && spec.eventsInside + spec.eventsOutside > 0 ? 1 : 0);
          expect(countByCode("bare-op-assumed-rest")).toBe(excludedCount);

          // Event-op warning: one per affected namespace.
          const eventWarningExpected =
            spec.httpLoaded && spec.eventsInside > 0 ? 1 : 0;
          expect(countByCode("event-op-in-service-namespace")).toBe(
            eventWarningExpected,
          );
        }),
        { seed: SEED, numRuns: RUNS },
      );
    },
    120_000,
  );
});
