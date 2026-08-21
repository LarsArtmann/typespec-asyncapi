import type { ComparisonRow, PipelineStep, UseCase } from './types';

export const pipelineSteps: PipelineStep[] = [
  {
    step: '01',
    title: 'Model in TypeSpec',
    desc: 'Define event schemas, channels, operations, servers, and security in one typed language. Decorators carry AsyncAPI semantics; the compiler carries the validation.',
  },
  {
    step: '02',
    title: 'Compile with tsp',
    desc: 'tsp compile resolves imports, checks 30 diagnostics, and hands the type graph to the emitter — invalid protocols and misplaced bindings never reach the output.',
  },
  {
    step: '03',
    title: 'Emit the spec',
    desc: 'A table-driven schema pipeline maps every scalar, constraint, union, and generic instantiation to JSON Schema, assembling the $ref chain AsyncAPI 3.1 expects.',
  },
  {
    step: '04',
    title: 'Validate and ship',
    desc: 'The 270+-test compliance suite proves every emitted document against the official AsyncAPI 3.1.0 JSON Schema — feed it to AsyncAPI Studio, generators, or CI.',
  },
];

export const comparisonRows: ComparisonRow[] = [
  { feature: 'AsyncAPI version', emitter: '3.1.0 (latest)', tspAsyncapi: '3.0.0', handwritten: 'any' },
  { feature: 'Output validation', emitter: '270+ AJV compliance tests', tspAsyncapi: '15 property tests', handwritten: 'Spectral, at best' },
  { feature: 'Protocols', emitter: '22, bindings spec-generated', tspAsyncapi: '13, hand-written', handwritten: 'manual per protocol' },
  { feature: 'Reusable components', emitter: '7 slots, 11 decorators', tspAsyncapi: 'not supported', handwritten: 'copy-paste' },
  { feature: 'Multi-file output', emitter: 'split-schemas + $ref rewrite', tspAsyncapi: 'not supported', handwritten: 'manual' },
  { feature: 'Compile-time diagnostics', emitter: '30 codes', tspAsyncapi: 'deferred', handwritten: 'lint only' },
  { feature: 'Typed source of truth', emitter: 'TypeSpec', tspAsyncapi: 'TypeSpec', handwritten: 'none' },
];

export const useCases: UseCase[] = [
  {
    title: 'AsyncAPI as code',
    desc: 'Schemas, examples, security schemes, and bindings regenerate from source — the spec can no longer drift from the system it describes.',
    icon: 'cog',
    accent: 'accent',
  },
  {
    title: 'Multi-protocol estates',
    desc: 'One TypeSpec namespace, Kafka + MQTT + WebSocket bindings with auto-injected versions and spec-checked placements across 22 protocols.',
    icon: 'refresh',
    accent: 'accent',
  },
  {
    title: 'CI compliance gates',
    desc: 'Every build emits documents that pass the official AsyncAPI 3.1.0 JSON Schema — contract violations fail the pipeline, not production.',
    icon: 'chart',
    accent: 'accent',
  },
  {
    title: 'Docs that stay current',
    desc: 'Descriptions, tags, examples, and external docs live next to the operations they describe, so documentation updates itself on every compile.',
    icon: 'bolt',
    accent: 'accent',
  },
];
