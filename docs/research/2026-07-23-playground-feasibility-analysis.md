# Playground Feasibility Analysis: TypeSpec → AsyncAPI Playground

**Date:** 2026-07-23
**Reference:** [play.d2lang.com](https://play.d2lang.com/)
**Question:** Should we build a demo/playground website for the typespec-asyncapi project?

---

## TL;DR

**Yes, we should build it — and it's dramatically cheaper than building from scratch.** Microsoft already publishes `@typespec/playground` (v0.16.0) and `@typespec/bundler` (v0.6.0) on npm — a reusable React component library + Vite toolchain designed specifically for creating custom TypeSpec playgrounds with custom emitters. We'd be wrapping our emitter in their proven infrastructure, not reinventing it.

---

## What the D2 Playground Does (Our Reference)

| Feature         | D2 Playground                   |
| --------------- | ------------------------------- |
| **Editor**      | Monaco with syntax highlighting |
| **Compilation** | Client-side WASM                |
| **Output**      | Rendered SVG diagram            |
| **Sharing**     | URL-encoded state (no backend)  |
| **Export**      | PNG/SVG/clipboard               |
| **Samples**     | Clickable snippet gallery       |
| **Themes**      | Light/dark + diagram themes     |

### D2 Playground Architecture Details

- **Frontend:** Vanilla HTML/CSS/JS (no heavy framework), built with esbuild
- **Code editor:** Monaco Editor (VS Code's editor) with custom D2 language provider
- **Compilation:** WASM build of the D2 compiler runs entirely client-side (Dagre + ELK engines). Only the proprietary TALA engine requires a server-side API call.
- **Pan/zoom:** Panzoom for SVG navigation
- **Stateless URL sharing:** On every compile, the editor script is encoded via `window.d2.encode()` (WASM compression) and stored in the URL as a `script=` query parameter. Layout engine, theme, sketch mode, and ASCII mode are also URL params. No accounts, no server storage, no database.
- **Error handling:** Inline gutter markers + wavy underlines via Monaco `setModelMarkers`, plus a dedicated error panel below the editor (capped at 5 messages)
- **Export:** PNG (renders SVG to canvas at devicePixelRatio), SVG download, clipboard copy (PNG + SVG)
- **Mobile:** Monaco replaced with plain `<textarea>`; clipboard-copy options hidden
- **Snippets:** Clickable code examples below the editor that load source and auto-compile — serving as both documentation and templates

### What Makes D2 Playground Excellent

1. **Zero friction** — no login, no install, just visit the URL
2. **Instant gratification** — default `x -> y` produces a visible diagram on first load
3. **Shareable by default** — every diagram is a URL
4. **Professional polish** — multiple layout engines, dozens of themes, sketch mode, ASCII output, PNG/SVG export
5. **Client-side-first** — most rendering in-browser via WASM, minimal server load
6. **Developer-friendly errors** — inline annotations + readable error panel with GitHub issue links
7. **Learn-as-you-go** — syntax snippets as interactive tutorials

---

## What We'd Build (TypeSpec → AsyncAPI Playground)

| Feature         | Our Playground                                            |
| --------------- | --------------------------------------------------------- |
| **Editor**      | Monaco with TypeSpec syntax (from `@typespec/playground`) |
| **Compilation** | Client-side JS (no WASM needed — compiler is pure JS)     |
| **Output**      | AsyncAPI YAML/JSON + rendered documentation               |
| **Sharing**     | URL-encoded state (built into `@typespec/playground`)     |
| **Export**      | Download YAML/JSON, copy to clipboard                     |
| **Samples**     | 11 existing example `.tsp` files ready to use             |
| **Visualizer**  | AsyncAPI Studio iframe OR `@asyncapi/react-component`     |

---

## Technical Feasibility: HIGH

### Our Emitter is Already Browser-Compatible

| Factor                                 | Status                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Compiler browser support               | ✅ `browser` field in `@typespec/compiler` package.json (official intent) |
| WASM requirement                       | ❌ None — pure JS, no WASM needed                                         |
| Emitter touches `fs` directly?         | ❌ No — delegates to `program.host` via `emitFile`                        |
| Virtual FS already proven              | ✅ Test harness compiles fully in-memory via `Map`                        |
| Node-only deps in emitter              | ❌ None — `yaml` is browser-safe                                          |
| `@typespec/asset-emitter` browser-safe | ✅ Pure JS, peer-deps on compiler only                                    |

**Key evidence:**

- `@typespec/compiler` declares a `browser` field in its `package.json`:
  ```json
  "browser": {
    "./dist/src/core/node-host.js": "./dist/src/core/node-host.browser.js",
    "./dist/src/core/logger/console-sink.js": "./dist/src/core/logger/console-sink.browser.js"
  }
  ```
- No WASM build exists — the entire compiler (parser, scanner, checker, binder, program) is pure JS/TS
- The `CompilerHost` abstraction allows custom hosts; the test framework's `createTester` builds one backed by `Map<string, string>`
- `$onEmit` is pure data transformation → `emitFile()` which delegates to `program.host.writeFile` (works with in-memory host)
- Only 3 runtime deps: `@typespec/compiler`, `@typespec/asset-emitter`, `yaml` — all browser-safe

### Official Playground Infrastructure (Published on npm)

| Package                | Version | Status                     |
| ---------------------- | ------- | -------------------------- |
| `@typespec/playground` | 0.16.0  | ✅ Published, MIT licensed |
| `@typespec/bundler`    | 0.6.0   | ✅ Published, MIT licensed |

`@typespec/playground` is a **reusable React component library** designed for creating custom playgrounds with custom emitters:

- `definePlaygroundViteConfig()` — one function generates the entire Vite config
- `renderReactPlayground()` — one function call mounts the full playground
- Monaco editor, compiler integration, URL state sharing, debounced compilation — **all built-in**
- `emitterViewers` prop maps emitter names to custom output viewers
- `typespecBundlePlugin` auto-bundles libraries and injects import maps

### AsyncAPI Studio Integration is Trivial

| Feature                     | Status                                     |
| --------------------------- | ------------------------------------------ |
| Iframe embedding            | ✅ Supported (no frame-blocking headers)   |
| URL parameter: `url`/`load` | ✅ Load from remote URL                    |
| URL parameter: `base64`     | ✅ Load from base64-encoded spec           |
| URL parameter: `readOnly`   | ✅ Read-only mode                          |
| postMessage API             | ❌ Not implemented                         |
| Docker self-hosting         | ✅ `docker run -p 8000:80 asyncapi/studio` |
| React component (docs only) | ✅ `@asyncapi/react-component`             |

Embed via:

```html
<iframe src="https://studio.asyncapi.com/?base64=...&readOnly=true"></iframe>
```

Or use `@asyncapi/react-component` for inline documentation rendering.

### Rich Content Already Available

- **11 example `.tsp` files** covering Kafka, WebSocket, HTTP, multi-protocol, advanced decorators
- 78 compliance tests proving spec correctness
- Real-world examples (e-commerce Kafka events, chat WebSocket)

Example files:

```
examples/simple/main.tsp
examples/basic-events/main.tsp
examples/kafka/main.tsp
examples/multi-channel/main.tsp
examples/comprehensive-protocols/main.tsp
examples/real-world/kafka-events.tsp
examples/real-world/http-events.tsp
examples/real-world/websocket-events.tsp
examples/real-world/multi-protocol-simple.tsp
examples/advanced/advanced-decorators.tsp
examples/smoke/main.tsp
```

---

## PRO (Why We Should Build It)

### 1. Official Infrastructure Already Exists (Massive De-risking)

- `@typespec/playground` v0.16.0 — **published on npm**, MIT licensed
- `@typespec/bundler` v0.6.0 — **published on npm**, MIT licensed
- Monaco editor, compiler integration, URL state sharing, debounced compilation — **all built-in**
- Maintained by Microsoft as part of the official `microsoft/typespec` monorepo

### 2. Our Emitter is Already Browser-Compatible

- Compiler has a `browser` field in `package.json` (official browser intent)
- Pure JS — **no WASM, no native modules**
- `$onEmit` delegates to `program.host.writeFile` — works with in-memory FS
- Test harness already compiles fully in-memory via `Map<string, string>`
- Only 3 runtime deps: `@typespec/compiler`, `@typespec/asset-emitter`, `yaml` — all browser-safe

### 3. Rich Content Already Available

- **11 example `.tsp` files** covering Kafka, WebSocket, HTTP, multi-protocol, advanced decorators
- 78 compliance tests proving spec correctness
- Real-world examples (e-commerce Kafka events, chat WebSocket)

### 4. AsyncAPI Studio Integration is Trivial

- Embed via `<iframe src="https://studio.asyncapi.com/?base64=...&readOnly=true">`
- No X-Frame-Options blocking
- OR use `@asyncapi/react-component` for inline documentation rendering

### 5. Strategic Value

- **Adoption catalyst** — zero-friction "try before install" (like d2-playground does for D2)
- **Documentation multiplier** — every example in docs can be a live playground link
- **Bug report enabler** — users share a URL reproducing their issue
- **Competitive positioning** — no other TypeSpec→AsyncAPI tool has this

### 6. Low Ongoing Maintenance

- The playground is a **thin wrapper** — when the emitter changes, the playground auto-tracks
- `@typespec/playground` is maintained by Microsoft
- URL-based sharing means **no backend infrastructure** — pure static hosting

---

## CONTRA (Risks & Costs)

### 1. Version Coupling

- `@typespec/playground` depends on `@typespec/compiler: ^1.14.0`
- Our project uses `^1.13.0` (resolves to 1.14.0 — **currently fine**)
- Future compiler major versions may break playground compatibility until playground catches up

### 2. Initial Build Complexity (Moderate)

- Must configure `@typespec/bundler` to bundle our emitter correctly
- `lib/main.tsp` imports generated JS from `dist/src/tsp-index.js` — bundler must discover and embed this
- Need to verify `@typespec/asset-emitter` bundles cleanly (it's pure JS, should work)
- Import map generation must resolve `@lars-artmann/typespec-asyncapi` correctly

### 3. Bundle Size

- Monaco editor: ~5MB
- TypeSpec compiler: ~2-3MB
- Fluent UI (playground's design system): ~1-2MB
- Total: **~8-10MB initial load** (acceptable for a developer tool, but not instant)
- Mitigation: code-splitting, lazy-load compiler after editor renders

### 4. Custom Viewer Work

- The playground's built-in file viewer shows raw text output
- For AsyncAPI, we'd want either:
  - **Minimal**: Raw YAML/JSON viewer (trivial, built-in)
  - **Good**: `@asyncapi/react-component` integration (moderate, 1-2 days)
  - **Premium**: Embedded AsyncAPI Studio iframe (moderate, base64 encoding + iframe)

### 5. Hosting Decision Required

- **GitHub Pages** — free, simple, `gh-pages` branch
- **Firebase Hosting** — free tier, custom domain
- **Vercel/Netlify** — free tier, automatic deploys

### 6. Dependency on Unstable Emitter Package

- Our emitter is `0.2.0-beta` — decorator APIs may change
- Playground would need rebuilding when emitter ships new versions
- Mitigation: playground lives in the same repo, CI builds both together

---

## Implementation Plan (Actionable Steps)

### Phase 1: Scaffold (2-3 hours)

1. Create `playground/` directory in the repo
2. Add `@typespec/playground`, `@typespec/bundler`, `vite`, `react`, `react-dom` as dev dependencies
3. Create `playground/vite.config.ts` using `definePlaygroundViteConfig()`
4. Create `playground/src/main.tsx` using `renderReactPlayground()`
5. Create `playground/index.html` with `<div id="root">`
6. Copy 3-4 best example `.tsp` files into `playground/samples/`

### Phase 2: Bundling & Integration (2-4 hours)

7. Run `bun install` and verify the bundler can bundle our emitter
8. Debug any bundling issues (import maps, `tsp-index.js` generation, asset-emitter)
9. Verify compilation works in-browser (start with a minimal sample)
10. Add the remaining 7 example files as samples

### Phase 3: Custom Output Viewer (2-4 hours)

11. Create an `AsyncAPIViewer` React component using `@asyncapi/react-component`
12. Register it via `emitterViewers: { "@lars-artmann/typespec-asyncapi": [AsyncAPIViewer] }`
13. Fallback: raw YAML/JSON viewer with syntax highlighting

### Phase 4: Polish (2-3 hours)

14. Add custom header/footer with project branding and links
15. Configure default sample to load on first visit
16. Test URL sharing (encode/decode state)
17. Test error display (invalid TypeSpec should show diagnostics inline)

### Phase 5: CI/CD & Deploy (1-2 hours)

18. Add `bun run build:playground` script to `package.json`
19. Set up GitHub Actions to deploy to GitHub Pages on push to `master`
20. Add playground link to README.md

**Total estimated effort: 10-16 hours (1.5-2 days)**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Static Site)                  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Monaco Edit │  │  @typespec/  │  │  AsyncAPI      │ │
│  │  (.tsp code) │──│  playground  │──│  Viewer        │ │
│  │              │  │  (React UI)  │  │  (react-comp   │ │
│  │  Syntax HL   │  │              │  │   or iframe)   │ │
│  │  Diagnostics │  │  Debounce    │  │                │ │
│  │              │  │  URL state   │  │  Rendered docs │ │
│  └──────────────┘  └──────┬───────┘  └────────────────┘ │
│                           │                               │
│                    ┌──────▼───────┐                       │
│                    │  @typespec/  │                       │
│                    │  compiler    │                       │
│                    │  (pure JS)   │                       │
│                    │              │                       │
│                    │  In-memory   │                       │
│                    │  Virtual FS  │                       │
│                    └──────┬───────┘                       │
│                           │                               │
│                    ┌──────▼───────┐                       │
│                    │  Our Emitter │                       │
│                    │  ($onEmit)   │                       │
│                    │              │                       │
│                    │  YAML/JSON   │                       │
│                    │  Output      │                       │
│                    └──────────────┘                       │
│                                                           │
│  No server. No backend. No database. Pure static files.   │
└─────────────────────────────────────────────────────────┘
```

---

## Key APIs Reference

### `definePlaygroundViteConfig()` (from `@typespec/playground/vite`)

```ts
import { definePlaygroundViteConfig } from "@typespec/playground/vite";

export default definePlaygroundViteConfig({
  defaultEmitter: "@lars-artmann/typespec-asyncapi",
  libraries: ["@typespec/compiler", "@lars-artmann/typespec-asyncapi"],
  samples: {
    "Simple Chat": {
      filename: "samples/simple.tsp",
      preferredEmitter: "@lars-artmann/typespec-asyncapi",
    },
  },
  links: {
    documentationUrl: "https://github.com/LarsArtmann/typespec-asyncapi",
  },
});
```

### `renderReactPlayground()` (from `@typespec/playground/react`)

```tsx
import { registerMonacoDefaultWorkersForVite } from "@typespec/playground";
import PlaygroundManifest from "@typespec/playground/manifest";
import { renderReactPlayground } from "@typespec/playground/react";
import "@typespec/playground/styles.css";

registerMonacoDefaultWorkersForVite();

await renderReactPlayground({
  ...PlaygroundManifest,
  emitterViewers: {
    "@lars-artmann/typespec-asyncapi": [AsyncAPIViewer],
  },
});
```

### Custom FileOutputViewer

```tsx
import type { FileOutputViewer } from "@typespec/playground/react";

const AsyncAPIViewer: FileOutputViewer = {
  key: "asyncapiViewer",
  label: "AsyncAPI",
  render: ({ filename, content }) => (
    <div style={{ padding: "1rem", fontFamily: "monospace" }}>
      <h3>{filename}</h3>
      <pre>{content}</pre>
    </div>
  ),
};
```

### `@typespec/bundler` CLI

```bash
tspd bundle ./node_modules/@lars-artmann/typespec-asyncapi --output-dir ./dist/browser
```

---

## Recommendation

**Build it.** The infrastructure cost is 90% lower than it appears because Microsoft already built and published the playground framework. We're a thin wrapper around proven tools with a proven output format. The strategic value — adoption, documentation, bug reporting — far outweighs 1-2 days of integration work.

The only real risk is version coupling to `@typespec/playground`, which is mitigated by it being an actively maintained Microsoft package in the official TypeSpec monorepo.

---

## Sources

- [D2 Playground](https://play.d2lang.com/)
- [D2 Playground Source (GitHub)](https://github.com/terrastruct/d2-playground)
- [`@typespec/playground` on npm](https://www.npmjs.com/package/@typespec/playground) (v0.16.0)
- [`@typespec/bundler` on npm](https://www.npmjs.com/package/@typespec/bundler) (v0.6.0)
- [`@typespec/playground` README](https://github.com/microsoft/typespec/blob/main/packages/playground/README.md)
- [`@typespec/bundler` README](https://github.com/microsoft/typespec/tree/main/packages/bundler)
- [Official TypeSpec Playground](https://typespec.io/playground/)
- [AsyncAPI Studio (GitHub)](https://github.com/asyncapi/studio)
- [`@asyncapi/react-component`](https://github.com/asyncapi/asyncapi-react)
