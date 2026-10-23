import { stats } from "./stats";

export const siteConfig = {
  name: "typespec-asyncapi",
  title: "TypeSpec AsyncAPI Emitter — Typed AsyncAPI 3.1 Specs from TypeSpec",
  description: `Define event schemas, channels, and operations in TypeSpec; generate AsyncAPI 3.1 YAML or JSON validated against the official JSON Schema. ${stats.protocols} protocols, ${stats.decorators} decorators, ${stats.diagnostics} diagnostics.`,
  ogDescription: `Stop hand-writing AsyncAPI YAML. Model your event-driven API in TypeSpec and emit validated AsyncAPI 3.1 for ${stats.protocols} protocols.`,
  siteUrl: "https://typespec-asyncapi.lars.software",
  github: "https://github.com/LarsArtmann/typespec-asyncapi",
  npm: "https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi",
  author: {
    name: "LarsArtmann",
    url: "https://larsartmann.com/",
  },
  social: {
    twitter: "@LarsArtmann",
  },
} as const;
