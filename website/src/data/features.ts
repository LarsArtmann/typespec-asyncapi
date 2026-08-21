import type { Feature } from './types';

export const features: Feature[] = [
  {
    icon: 'shield',
    title: 'Validated AsyncAPI 3.1',
    desc: 'Every byte of output is checked against the official AsyncAPI 3.1.0 JSON Schema (AJV) across a 270+-test compliance suite — invalid specs cannot ship.',
    accent: 'accent',
  },
  {
    icon: 'glob',
    title: '22 protocols, 19 bindings',
    desc: 'Kafka, MQTT, AMQP, WebSocket, NATS, and more. All bindings auto-generated from @asyncapi/specs with version auto-injection and placement checking.',
    accent: 'accent',
  },
  {
    icon: 'code',
    title: '30 typed decorators',
    desc: 'Channels, messages, servers, security schemes, traits, parameters, and protocol bindings — declared in TypeSpec with compile-time validation, not YAML indentation.',
    accent: 'accent',
  },
  {
    icon: 'layers',
    title: 'Clean $ref architecture',
    desc: 'Named models, enums, and generic instantiations (Page<User> → PageUser) become reusable components.schemas entries with spec-correct reference chains.',
    accent: 'accent',
  },
  {
    icon: 'lightning',
    title: 'One compile, many outputs',
    desc: 'Emit single-file YAML or JSON, or split every schema into its own file with rewritten $ref pointers. Version info flows in from @typespec/versioning.',
    accent: 'accent',
  },
  {
    icon: 'check',
    title: '30 compile-time diagnostics',
    desc: 'Unsupported protocols, misplaced bindings, malformed server URLs, and invalid security schemes are caught in your editor before they reach the output.',
    accent: 'accent',
  },
];
