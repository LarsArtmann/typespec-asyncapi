import { defineConfig, fontProviders } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://typespec-asyncapi.lars.software",
  security: {
    csp: {
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
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
    sitemap(),
    starlight({
      title: "typespec-asyncapi",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/starlight.css"],
      lastUpdated: true,
      editLink: {
        baseUrl: "https://github.com/LarsArtmann/typespec-asyncapi/edit/master/website",
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
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Decorators", slug: "guides/decorators" },
            { label: "Protocol Bindings", slug: "guides/bindings" },
            { label: "Schema Generation", slug: "guides/schemas" },
            { label: "Security", slug: "guides/security" },
            { label: "Reusable Components", slug: "guides/reusable-components" },
            { label: "Multi-File Output", slug: "guides/split-schemas" },
            { label: "Versioning", slug: "guides/versioning" },
          ],
        },
        {
          label: "Reference",
          items: [
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
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
