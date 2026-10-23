import { defineConfig, fontProviders } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import starlightLlmsTxt from "starlight-llms-txt";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://typespec-asyncapi.lars.software",
  // Drops two known-benign upstream warnings; see astro-logger.mjs.
  logger: { entrypoint: "./astro-logger.mjs" },
  security: {
    csp: {
      scriptDirective: {
        resources: ["'self'", "'wasm-unsafe-eval'"],
      },
      styleDirective: {
        // Starlight renders code blocks with Expressive Code, which highlights
        // through Shiki by writing token colors to style attributes. CSP has no
        // hash/nonce form for attributes, so 'unsafe-inline' is scoped to
        // style-src-attr only; `style-src` keeps Astro's element hashes, so inline
        // <style> blocks stay hash-controlled. Declaring only the attribute entry
        // also avoids the `style-src`/`style-src-attr` shadowing warning.
        resources: [{ resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },

  compressHTML: true,

  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      weights: [300, 400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],

  integrations: [
    sitemap({
      filter: (page) => !page.includes("/search/"),
    }),
    starlight({
      title: "typespec-asyncapi",
      plugins: [
        starlightLlmsTxt({
          description:
            "TypeSpec AsyncAPI emitter: define event channels, messages, and operations in TypeSpec, then generate AsyncAPI 3.1 YAML or JSON validated against the official AsyncAPI JSON Schema.",
          details:
            "Install with `pnpm add @lars-artmann/typespec-asyncapi` and add it to your `tspconfig.yaml` emitter list. Every documented decorator and emitter option applies to the generated document.",
          optionalLinks: [
            {
              label: "GitHub repository",
              url: "https://github.com/LarsArtmann/typespec-asyncapi",
              description: "Source code and issue tracker",
            },
            {
              label: "npm package",
              url: "https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi",
              description: "Published releases",
            },
          ],
          promote: [
            "getting-started/**",
            "guides/**",
            "reference/**",
            "examples",
            "faq",
          ],
          demote: ["404"],
          exclude: ["404"],
        }),
      ],
      // The custom 404 lives at src/content/docs/404.md. Starlight injects its own
      // static /404 route otherwise, which shadows the content page and logs
      // `Could not render /404 ... conflicts with higher priority route`.
      disable404Route: true,
      favicon: "/favicon.svg",
      customCss: ["./src/styles/starlight.css"],
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/LarsArtmann/typespec-asyncapi/edit/master/website",
      },
      expressiveCode: {
        themes: ["github-light", "dracula"],
        frames: {
          showCopyToClipboardButton: true,
        },
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
            { label: "Migration Guide", slug: "getting-started/migration" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Decorators", slug: "guides/decorators" },
            { label: "Protocol Bindings", slug: "guides/bindings" },
            { label: "Schema Generation", slug: "guides/schemas" },
            { label: "Security", slug: "guides/security" },
            {
              label: "Reusable Components",
              slug: "guides/reusable-components",
            },
            { label: "Multi-File Output", slug: "guides/split-schemas" },
            { label: "Versioning", slug: "guides/versioning" },
            {
              label: "Mixing with OpenAPI",
              slug: "guides/mixing-with-openapi",
            },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Architecture", slug: "reference/architecture" },
            { label: "Emitter Options", slug: "reference/emitter-options" },
            { label: "Diagnostics", slug: "reference/diagnostics" },
            {
              label: "npm Package",
              link: "https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi",
            },
          ],
        },
        {
          label: "Community",
          items: [
            { label: "Examples", slug: "examples" },
            { label: "FAQ", slug: "faq" },
            { label: "Changelog", slug: "changelog" },
            { label: "Contributing", slug: "contributing" },
            { label: "Related Tools", slug: "related-tools" },
          ],
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/LarsArtmann/typespec-asyncapi",
        },
      ],
      head: [
        {
          tag: "meta",
          attrs: {
            name: "description",
            content:
              "Stop hand-writing AsyncAPI YAML. Model your event-driven API in TypeSpec and emit AsyncAPI 3.1 specifications validated against the official JSON Schema.",
          },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:site", content: "@LarsArtmann" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:creator", content: "@LarsArtmann" },
        },
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/plain",
            href: "/llms.txt",
            title: "LLM documentation index",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "search",
            type: "application/opensearchdescription+xml",
            href: "/opensearch.xml",
            title: "Search typespec-asyncapi",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "application/rss+xml",
            href: "/rss.xml",
            title: "typespec-asyncapi releases",
          },
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
