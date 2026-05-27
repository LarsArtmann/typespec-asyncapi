# Consumer Perspective: What This Project Is Missing

An honest audit of what a **consumer** (someone installing `@lars-artmann/typespec-asyncapi` to generate AsyncAPI specs from TypeSpec) would find lacking, confusing, or broken.

---

## Critical — Things That Will Break or Confuse Consumers

### 1. Decorators silently discard data

Six decorators accept data but the emitter never uses it. The consumer writes valid TypeSpec, gets no errors, and the data simply vanishes from the output:

| Decorator | What's lost |
|-----------|-------------|
| `@tags` | Tags are stored in state but never read during emission — `components.tags` and inline tags are absent |
| `@correlationId` | Correlation ID data stored but never emitted on messages |
| `@header` | Message headers stored but never emitted |
| `@bindings` (on Models) | Binding data stored but never emitted on messages |
| Channel path parameters `{orderId}` | Parsed from paths but never emitted as `parameters` on channels |

**Impact:** Consumers will write decorators following the docs, get no warnings, and wonder why their AsyncAPI output is incomplete.

### 2. Examples that won't compile

Several examples use decorators and namespaces that don't exist:

- `examples/basic-events/main.tsp` uses `@asyncapi({...})` — this decorator is not declared in `lib/main.tsp`
- `examples/user-events.tsp` uses the same ghost `@asyncapi` decorator
- 6 examples use `using AsyncAPI;` instead of the correct `using TypeSpec.AsyncAPI;`
- Only 1 of ~15 examples has a `tspconfig.yaml`

**Impact:** A consumer following examples will hit compilation errors immediately.

### 3. Documentation contradicts the code

- The getting-started guide shows `@asyncapi({...})` usage — doesn't exist
- The plugin-development guide references `ProtocolPlugin`, `pluginRegistry`, `AsyncAPIProtocolType` — none of these exist in the codebase
- Mapping guides show `@server("url", "description")` with two strings, but the actual signature is `@server(target, name, config: Record<unknown>)`
- Multiple docs use wrong package names (`@typespec/asyncapi`, `@larsartmann/typespec-asyncapi`)
- README shows `npx tsp compile --emit @typespec/asyncapi` — wrong package

**Impact:** Consumers following official documentation will be misled.

### 4. No reference output anywhere

There are zero golden files, snapshot tests, or example output files in the entire repository. A consumer cannot see what the emitter will produce without cloning, building, and running it themselves.

**Impact:** Consumers can't evaluate whether the output meets their needs before investing time.

### 5. Dead configuration options

The emitter accepts 15+ options but only reads 6 of them. The rest are silently ignored:

| Option | Claimed | Reality |
|--------|---------|---------|
| `protocol-bindings` | Protocol filter | Ignored |
| `versioning` | Version strategy | Ignored |
| `security-schemes` | Security filter | Ignored |
| `validate-spec` | AsyncAPI validation | Ignored (no validation code exists) |
| `omit-unreachable-types` | Schema pruning | Ignored |
| `include-source-info` | Source metadata | Ignored |
| `source-maps` | Source maps | Ignored |
| `debug` | Debug output | Ignored |

**Impact:** Consumers will configure options, expect behavior changes, and get the same output regardless.

---

## High Priority — Missing Features Consumers Expect

### 6. No AsyncAPI 3.0 traits support

AsyncAPI 3.0 has message traits, operation traits, and channel traits for reuse. This emitter has zero support for any of them — no decorators, no state, no emission.

### 7. No output validation

The `@asyncapi/parser` is a dependency. The `validate-spec` option defaults to `true`. There is zero code that validates the output. A consumer could get malformed AsyncAPI with no warning.

### 8. No server variables support

AsyncAPI 3.0 supports server variables (e.g., `{env}`, `{region}`). The `ServerConfigData` type only has `url`, `protocol`, `description`, `name` — no variables field.

### 9. No output customization

No filtering, no include/exclude patterns, no naming conventions, no `$ref` prefix control, no multi-format output, no file-name interpolation. What the emitter produces is what you get.

### 10. No TypeSpec options model in `lib/main.tsp`

Other TypeSpec emitters define an `EmitterOptions` model in their `.tsp` file, giving consumers IDE autocomplete and compile-time validation for options. This emitter only defines options in TypeScript — consumers get no IntelliSense in `tspconfig.yaml`.

---

## Medium Priority — Friction and Polish

### 11. No playground or sandbox

No online demo, no StackBlitz/CodeSandbox link, no `npx` one-liner. To try the emitter, a consumer must clone the repo, install dependencies with Bun, and build from source.

### 12. No migration guide

No documentation for consumers coming from manual AsyncAPI YAML, `@asyncapi/parser`, `asyncapi-validator`, or OpenAPI-to-AsyncAPI conversion workflows.

### 13. Missing CHANGELOG.md

The `package.json` `files` array includes `CHANGELOG.md` but the file doesn't exist. Release notes in `docs/releases/` are aspirational — they claim features as "CONFIRMED WORKING" and "Production Ready" that the project's own `FEATURES.md` marks as BROKEN.

### 14. No negative test coverage

Test fixtures cover only happy paths. No tests for: invalid decorator usage, circular model references, empty namespaces, missing required fields, conflicting decorators on the same target, or the edge cases a consumer will inevitably hit.

### 15. Diagnostic messages defined but never used

The codebase has two parallel diagnostic systems: well-crafted parameterized messages in `lib.ts` and inline raw strings in `minimal-decorators.ts`. The decorators use the inline strings, so the polished `$lib` diagnostics are dead code. Error messages consumers see are less helpful than they could be.

---

## Quick Wins That Would Help Most

If effort is limited, these changes would most improve the consumer experience:

1. **Fix the examples** — make at least 3 examples that compile and produce correct output, each with a `tspconfig.yaml`
2. **Add one reference output file** — show what `asyncapi.yaml` actually looks like for a realistic input
3. **Emit tags, headers, correlationId** — the data is already stored; wire it to the output
4. **Remove or mark dead options** — stop accepting options the emitter ignores, or add a diagnostic warning
5. **Add an `EmitterOptions` model to `lib/main.tsp`** — gives consumers IDE autocomplete for config
6. **Delete the fictional plugin-development guide** — it references APIs that don't exist
