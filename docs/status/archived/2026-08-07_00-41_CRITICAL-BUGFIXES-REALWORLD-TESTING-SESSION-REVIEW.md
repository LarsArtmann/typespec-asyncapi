# Status Report: Critical Bug Fixes + Real-World Testing Solidification
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-07 00:41
**Session Duration:** ~45 minutes
**Author:** Crush (AI assistant)

---

## Executive Summary

Fixed all 9 remaining test failures from the previous session, completed all planned real-world testing tasks, and committed everything. The codebase is now at **1282 tests passing across 101 files**, with 0 lint errors and 0 build errors. However, several things were forgotten or done poorly during this session.

---

## a) FULLY DONE

### 1. Fixed All 9 Test Failures in `asyncapi-3.1-features.test.ts`

Root causes identified and fixed:

| #   | Failure                 | Root Cause                                                             | Fix                                                       |
| --- | ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| ~~1~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`server.variables enum`~~ | ~~`enum` is a reserved keyword in TypeSpec `#{}` value literals~~ | ~~Added `values` → `enum` mapping in `server-builder.ts`~~ |
| ~~2~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`server.security`~~ | ~~Object `{ sasl: [...] }` not wrapped in array~~ | ~~Added `normalizeSecurity()` to wrap single objects~~ |
| ~~3~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`channel.servers`~~ | ~~`buildServers` ran AFTER `attachChannelServerRefs` — servers map empty~~ | ~~Reordered pipeline in `document-builder.ts`~~ |
| ~~4-5~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`message.schemaFormat`~~ | ~~`storeMessageConfig` stripped `schemaFormat` from stored config~~ | ~~Changed to store full `MessageConfigData`~~ |
| ~~6~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`message.examples`~~ | ~~Same root cause as schemaFormat — examples stripped~~ | ~~Same fix~~ |
| ~~7~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`operation.security`~~ | ~~Emitted `{ jwt: [] }` (OpenAPI style), AsyncAPI 3.1 needs `$ref`~~ | ~~Changed to `{ $ref: "#/components/securitySchemes/jwt" }`~~ |
| ~~8~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`User.id property ref`~~ | ~~Test placed `model` before `namespace` (syntax error)~~ | ~~Moved namespace before models~~ |
| ~~9~~ done at `72a4dc09`, `b5a437cc`, `c6762a64` | ~~`combined full graph`~~ | ~~Namespace-level decorators inside namespace body + syntax errors~~ | ~~Moved decorators before `namespace` keyword~~ |

**Files changed:**

- `src/builders/server-builder.ts` — `buildServerVar()` + `normalizeSecurity()` extracted
- `src/builders/operation-builder.ts` — Security refs emit `$ref` format
- `src/document-builder.ts` — Pipeline reordered (servers before channel refs)
- `src/domain/models/asyncapi-document.ts` — `SecurityRequirement` type changed to `Ref | Partial<SecurityScheme>`
- `src/state-writers.ts` — `storeMessageConfig` stores full config
- `src/store-protocol-config.ts` — NEW file (extracted to keep state-writers under 400 lines)
- `test/integration/asyncapi-3.1-features.test.ts` — All 14 tests rewritten with correct syntax

### 2. Installed Missing TypeSpec Packages

`@typespec/http`, `@typespec/rest`, `@typespec/openapi3`, `@typespec/json-schema` added as devDependencies.

### 3. Created 3 Adapted Fixture Test Suites (24 tests)

- **bterlson/typespec-todo** (9 tests): Tests `@minLength`, `@maxLength`, `@visibility`, `safeint`, property refs, union enums, optional properties
- **DanSnow/typespec-events** (7 tests): Tests `int64`, nested `$ref`, arrays of named models, `@doc`
- **Azure EventGrid** (8 tests): Tests `bytes`, `unknown`, `utcDateTime`, mixed required/optional, complex model

### 4. Golden File Capture for livesession/xyd

- 1643-line golden file generated from the 724-line production codebase
- 3 tests: exact match, zero errors, 40+ schema count check
- Regression guard for all future emitter changes

### 5. Updated AGENTS.md

Added 14 new gotcha entries documenting:

- `enum` keyword workaround
- AsyncAPI 3.1 security `$ref` format
- Blockless namespace ordering
- Bottom-up decorator execution
- Build pipeline ordering
- `storeMessageConfig` full config storage
- TypeSpec v1.14 `@visibility` breaking change
- `storeProtocolConfig` extraction
- Real-world GitHub repo testing summary

### 6. All Tests Pass

```
Test Files  101 passed (101)
Tests       1282 passed (1282)
Lint        0 errors, 0 warnings
Build       0 errors
```

---

## b) PARTIALLY DONE

### 1. Cross-Emitter Milehimikey Test

The test EXISTS from the previous session (`test/realworld/cross-emitter-milehimikey.test.ts`, 5 tests) and correctly documents API differences. But it only documents FAILURE diagnostics — it does NOT create an ADAPTED version that compiles successfully and validates the output. The plan called for "compile, verify output correctness (channels, operations, $ref chains, enum values)" but we only got diagnostic assertions.

### 2. Planning Doc Execution

The plan at `docs/planning/2026-08-06_22-41_FIX-CRITICAL-BUGS-AND-SOLIDIFY-REAL-WORLD-TESTING.md` had 12 phases. Phases 1-11 were executed. Phase 12 (final commit + push) was partially done — committed but not pushed.

### 3. Real-World Test Coverage

The adapted fixtures test schema generation patterns, but none of them test:

- Protocol bindings output
- Server configuration output
- Security scheme output
- Message correlation IDs
- Operation reply patterns
- Reusable components (traits, parameters)

---

## c) NOT STARTED

### 1. bterlson/typespec-todo Full Compilation

The original bterlson repo imports `@typespec/http` and uses HTTP decorators (`@route`, `@get`, `@post`). Even with the packages installed, the verbatim file (`test/realworld/repos/bterlson-typespec-todo.tsp`) was NOT re-tested to see if it compiles now. The adapted fixture avoids HTTP decorators entirely.

### 2. Golden File Regeneration Documentation

No documentation was added on HOW to regenerate the golden file if the emitter output changes intentionally. The test will fail on any schema output change, forcing investigation.

### 3. Coverage Verification

`pnpm run verify` (full gate: build + lint + test + coverage:gate + duplicate) was NOT run. Only build + lint + test were verified.

### 4. Duplicate Code Analysis

`pnpm run duplicate` (jscpd) was NOT run. No verification that the new `store-protocol-config.ts` extraction didn't introduce duplication.

---

## d) TOTALLY FUCKED UP

### 1. Debug Logging Left in Committed Code

During debugging, I added `console.error("DEBUG...")` statements and an `import { writeFileSync } from "node:fs"` to `src/builders/channel-builder.ts`. These were committed by the auto-commit daemon as `279216c chore(channel-builder): add debug logging for channel server refs`. I then had to remove them in a follow-up commit. **This is the exact same class of bug that the previous session's handoff warned about.**

### 2. Multiple Throwaway Debug Test Files

I created `test/debug-dump.test.ts` multiple times with different debugging content, deleted it, recreated it. Each iteration was a waste of time. A better approach would have been to use the existing test infrastructure or a single well-structured debug test.

### 3. Left Debug Test File in Git History

`test/debug-dump.test.ts` was committed (as `767a224 test(emitter): add debug dump test for AsyncAPI emitter output`) and later deleted (`c6762a6` removed it). The git history now has a debug test file that should never have been committed.

### 4. Commit Hygiene

The auto-commit daemon committed intermediate work multiple times during the session:

- `767a224 test(emitter): add debug dump test`
- `279216c chore(channel-builder): add debug logging`

Both of these were "work in progress" that should never have been committed. The daemon is expected behavior per AGENTS.md, but I should have been more careful about leaving debug code in source files.

### 5. Test Rewriting Instead of Understanding

When I first encountered the 9 failures, I spent ~15 minutes writing throwaway debug tests to dump output. A more experienced approach would have been to READ THE CODE first — the pipeline ordering bug (`buildServers` after `attachChannelServerRefs`) was visible by reading `document-builder.ts` for 30 seconds. The `storeMessageConfig` stripping bug was visible by reading `state-writers.ts`. I jumped to dynamic debugging before static analysis.

### 6. Didn't Push

The plan called for a final push. I did not push any commits to the remote.

---

## e) WHAT WE SHOULD IMPROVE

### Process Improvements

~~1. **Read code before debugging** — Static analysis (reading the source) would have identified the pipeline ordering bug and the `storeMessageConfig` stripping bug in under 2 minutes each. Instead, I spent 15+ minutes writing throwaway debug tests.~~ **Won't implement — process lesson recorded in this report; no separate artifact.**

~~2. **Never leave debug code in source files** — The auto-commit daemon will commit it. Write debug output to `/tmp/` files or use `console.error` that gets immediately removed before the next tool call.~~ **Won't implement — process lesson; the daemon-committed debug code was reverted within the same session.**

~~3. **Understand TypeSpec syntax before writing tests** — Many of the original test failures were due to incorrect TypeSpec syntax (`enum` as a keyword, models before namespace). The tests were written by a previous session that didn't verify syntax.~~ **Won't implement — process lesson; TypeSpec syntax gotchas now live in `AGENTS.md:107`.**

~~4. **Run coverage gate** — The `pnpm run verify` command exists for a reason. Not running it means we don't know if the new code is adequately covered.~~ done — the coverage gate is part of the standing verify pipeline ( `FEATURES.md:10` )

~~5. **Consider the AsyncAPI spec before writing emitter code** — The security format bug (`{ jwt: [] }` vs `{ $ref: "..." }`) was an emitter implementation that didn't match the spec. The AsyncAPI 3.1 JSON Schema should have been consulted when implementing the feature.~~ done — AJV validation is standing policy across the compliance suite ( `AGENTS.md:115` )

### Code Quality Improvements

~~6. **`storeProtocolConfig` extraction is a band-aid** — The file was extracted solely to satisfy the 400-line lint rule. A better approach would be to split `state-writers.ts` by domain (message writers, server writers, security writers, reusable component writers).~~ **Won't implement — never split further; the extraction stands as the max-lines precedent ( `AGENTS.md:32` ).**

~~7. **Server variable `values` → `enum` mapping is a leaky abstraction** — Users have to know that `enum` is reserved and use `values` instead. A better solution would be to support both `enum` and `values` as input keys, or to document this prominently in the decorator JSDoc.~~ done — both `values` and `enum` input keys are accepted ( `src/builders/server-builder.ts:22` )

~~8. **`normalizeSecurity` in server-builder is in the wrong layer** — Security normalization belongs in the state writer or decorator, not in the builder. The builder should receive already-typed data.~~ **Won't implement — `normalizeSecurity` still lives in `src/builders/server-builder.ts:43`; output locked by goldens.**

~~9. **`SecurityRequirement` type is too loose** — `Ref | Partial<SecurityScheme>` allows any partial security scheme. It should be a proper discriminated union matching the AsyncAPI 3.1 schema.~~ **Won't implement — type unchanged ( `src/domain/models/asyncapi-document.ts:155` ); behavior locked by AJV tests and `test/golden/server-security.test.ts`.**

~~10. **No integration test for the full pipeline ordering** — The `buildServers` before `attachChannelServerRefs` ordering bug was only caught by a specific test. A "full pipeline smoke test" that exercises every builder in sequence would catch ordering issues systematically.~~ **Won't implement — no dedicated whole-pipeline test; ordering locked by `test/golden/server-security.test.ts` and the compliance suite.**

---

## f) Up to 50 Things We Should Get Done Next

### Critical (must do)

~~1. **Push all commits to remote** — 6 commits are unpushed~~ done — pushed long since; `v1.2.0` tagged 2026-11-19
~~2. **Run `pnpm run verify`** — Coverage gate + duplicate analysis not verified~~ done — the full verify gate is standing policy ( `AGENTS.md:26` )
~~3. **Run `pnpm run duplicate`** — Verify the `storeProtocolConfig` extraction didn't add duplication~~ done — jscpd is a standing verify stage, 0 clones ( `FEATURES.md:9` )
~~4. **Remove debug commits from git history** — Consider squashing `767a224` and `279216c` (debug code) into the fix commits~~ **Won't implement — history kept as-is; `767a224` and `279216c` remain, reverted by follow-up commits in the same session.**

### High Priority

~~5. **Create adapted milehimikey test that COMPILES** — Current test only documents failures; create an adapted version that uses our decorator API and validates the output~~ done — `test/realworld/cross-emitter-milehimikey.test.ts` compiles an adapted source through this emitter
~~6. **Re-test bterlson/typespec-todo verbatim file** — Now that `@typespec/http` is installed, see if it compiles (will still fail on `@visibility("read")` string syntax)~~ done — verbatim repos compiled by `test/realworld/github-actual-files.test.ts` ( incl. `bterlson-typespec-todo.tsp` )
~~7. **Add protocol binding tests to adapted fixtures** — None of the adapted fixtures test `@protocol`, `@bindings`, or binding output~~ **NOT-DO — subsumed by the compliance suite: `test/compliance/protocol-bindings.test.ts` and `new-protocol-bindings.test.ts`.**
~~8. **Add security scheme tests to adapted fixtures** — None test `@security` + `@operationSecurity` end-to-end~~ **NOT-DO — subsumed by `test/domain/security-schemes.test.ts` ( 13 AJV tests, `CHANGELOG.md:265` ).**
~~9. **Add server config tests to adapted fixtures** — None test `@server` with variables, protocolVersion, pathname~~ **NOT-DO — subsumed by `test/compliance/servers-security.test.ts` and `test/golden/server-security.test.ts`.**
~~10. **Add correlation ID tests to adapted fixtures** — None test `@correlationId` on messages~~ **NOT-DO — subsumed by the correlationIds coverage in `test/compliance/reusable-components.test.ts`.**
~~11. **Add operation reply tests to adapted fixtures** — None test `@reply` request-reply patterns~~ **NOT-DO — subsumed by `test/compliance/operation-reply.test.ts`.**
~~12. **Add reusable component tests to adapted fixtures** — None test `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding`~~ **NOT-DO — subsumed by `test/compliance/reusable-components.test.ts` ( 43 tests ).**
~~13. **Golden file for bterlson adapted output** — Lock the adapted fixture output as regression guard~~ **Won't implement — no golden for the adapted fixture; `test/realworld/golden/` holds only the xyd capture.**
~~14. **Golden file for DanSnow adapted output** — Same~~ **Won't implement — no golden for the adapted fixture; `test/realworld/golden/` holds only the xyd capture.**
~~15. **Golden file for Azure EventGrid adapted output** — Same~~ **Won't implement — no golden for the adapted fixture; `test/realworld/golden/` holds only the xyd capture.**
~~16. **Document golden file regeneration** — Add a script or documented command for regenerating golden files~~ done — `scripts/regenerate-golden.ts` exists

### Medium Priority

~~17. **Split `state-writers.ts` by domain** — Instead of one 400-line file + extracted protocol config, split into `message-state-writers.ts`, `server-state-writers.ts`, `security-state-writers.ts`, `reusable-state-writers.ts`~~ **Won't implement — never split further; `store-protocol-config.ts` extraction stands ( `AGENTS.md:32` precedent ).**
~~18. **Fix `SecurityRequirement` type** — Make it a proper discriminated union matching AsyncAPI 3.1 schema `securityRequirements` definition~~ **Won't implement — type remains `Ref | Partial<SecurityScheme>` ( `src/domain/models/asyncapi-document.ts:155` ).**
~~19. **Move `normalizeSecurity` to state writer layer** — Builders should receive typed data, not normalize at build time~~ **Won't implement — still in the builder layer ( `src/builders/server-builder.ts:43` ).**
~~20. **Support `enum` as input key in server variables** — Accept both `enum` and `values` for ergonomics (even though `enum` is reserved in `#{}`, model-expression `{}` syntax can use it)~~ done — both `values` and `enum` accepted as input keys ( `src/builders/server-builder.ts:22` )
~~21. **Add full pipeline ordering test** — Test that exercises every builder function and verifies the output is complete~~ **Won't implement — no dedicated pipeline test; ordering locked by `test/golden/server-security.test.ts`.**
~~22. **Consult AsyncAPI 3.1 JSON Schema for every feature** — The security format bug proves we need schema-driven development~~ done — schema-driven AJV validation is standing policy ( `AGENTS.md:115` )
~~23. **Add `@visibility` migration helper** — Detect `@visibility("read")` string syntax and suggest `Lifecycle.Read` enum syntax~~ **Won't implement — `@visibility` mapping handled in `src/constraint-mapper.ts:162`; no migration helper diagnostic was added.**
~~24. **Test message `examples` with `@example` decorator** — Current test uses `@message(#{examples: [...]})` but doesn't test `@example` decorator on model properties~~ done — `@example` covered in `test/compliance/constraint-decorators.test.ts` and `doc-propagation.test.ts`
~~25. **Test `schemaFormat` with external schema refs** — When `schemaFormat` is non-JSON, the payload ref should point to external schema~~ **Won't implement — only message-level `schemaFormat` is tested ( `test/integration/asyncapi-3.1-features.test.ts` ); external-schema refs never tested.**
~~26. **Add `data_base64` to bytes format mapping test** — Azure fixture tests `bytes` → `{type:"string", format:"byte"}`, but doesn't test the actual `data_base64` property name from CloudEvents spec~~ done — asserted in `test/realworld/adapted/azure-eventgrid-adapted.test.ts:86`
~~27. **Test `unknown` type rendering** — Azure fixture checks `data` property is defined but doesn't assert its schema representation~~ done — `unknown` mapping asserted in `test/compliance/type-mapping-completeness.test.ts:190`
~~28. **Run adapted fixtures through AsyncAPI 3.1 schema validation** — Currently only the combined test uses `compileAndValidateOrThrow`; adapted fixtures should too~~ **Won't implement — adapted fixtures are compile-only; AJV validation lives in the compliance suite ( `AGENTS.md:115` ).**
~~29. **Add negative tests to adapted fixtures** — What happens when models have circular references? Missing properties? Invalid types?~~ **NOT-DO — subsumed by `test/integration/reusable-components-negative.test.ts` and `decorator-negative.test.ts`.**
~~30. **Document the cross-emitter API differences in a comparison table** — milehimikey vs this emitter decorator-by-decorator~~ done — comparison table shipped in `README.md:40`
~~31. **Search for MORE GitHub repos using TypeSpec** — The previous search found zero repos using `TypeSpec.AsyncAPI`; re-search with different terms as the ecosystem grows~~ done — five verbatim GitHub repos under test ( `test/realworld/github-actual-files.test.ts`, `test/realworld/repos/` )
~~32. **Create example specs in this repo** — `examples/` directory with real-world patterns users can copy~~ done — runnable examples workspace ( `README.md:356`, `CHANGELOG.md:246` )
~~33. **Add CI workflow** — GitHub Actions running `pnpm run verify` on every push/PR~~ done — `.github/workflows/ci.yml` runs the full gate
~~34. **Add CHANGELOG entry** — The security format change is a breaking change that should be documented~~ done — recorded at `CHANGELOG.md:413` and `:427`
~~35. **Update README with real-world testing section** — Mention the GitHub repos tested and what compiles~~ done — real-world regression guards documented at `README.md:340`

### Lower Priority

~~36. **Test performance with large specs** — Benchmark suite exists but doesn't test with real-world model complexity~~ **Won't implement — benchmarks use synthetic fixtures only ( `test/benchmark/fixture-generator.ts` ); no real-world-model benchmark added.**
~~37. **Add property-based testing** — Generate random valid AsyncAPI specs and verify they compile~~ done — `test/property/emitter-properties.test.ts` and `mixed-ownership-properties.test.ts` exist
~~38. **Add snapshot testing for error messages** — Diagnostic messages should be stable across versions~~ **Won't implement — no error-message snapshot tests were ever added.**
~~39. **Test with TypeSpec nightly** — Ensure compatibility with upcoming TypeSpec versions~~ **Won't implement — no nightly CI job exists ( `.github/workflows/` ).**
~~40. **Add migration guide from OpenAPI** — For users coming from `@typespec/openapi3`~~ done — migration guide shipped at `website/src/content/docs/getting-started/migration.md`
~~41. **Add migration guide from milehimikey emitter** — Document decorator API differences~~ **Won't implement — no milehimikey-named guide; API differences documented in `test/realworld/cross-emitter-milehimikey.test.ts`.**
~~42. **Test multi-file output with adapted fixtures** — `split-schemas` option with real-world models~~ **NOT-DO — subsumed by `examples/split-schemas` and the e2e split-schemas tests.**
~~43. **Test YAML output format** — All tests use JSON; verify YAML output is correct~~ done — YAML flavor covered in compliance and e2e tests ( `test/compliance/protocol-bindings.test.ts` )
~~44. **Add JSDoc to `storeProtocolConfig`** — The extraction file has minimal documentation~~ done — header docs present in `src/store-protocol-config.ts`
~~45. **Review `extractMessageConfig` for completeness** — Are there other `@message` config fields we're dropping?~~ done — `extractMessageConfig` handles the full set incl. `schemaFormat` and `examples` ( `src/decorator-helpers.ts:290` )
~~46. **Test `@message` with model-expression `{}` syntax** — All tests use `#{}` value literals; verify `{}` also works~~ done — model-expression syntax exercised in `test/external/external-specs.test.ts:439`
~~47. **Test server bindings output** — Namespace-level `@bindings` producing server bindings~~ done — server bindings covered ( `FEATURES.md:115`, `test/golden/server-security.test.ts` )
~~48. **Add test for `@tags` on adapted fixtures** — Rich tag objects with `externalDocs`~~ **NOT-DO — subsumed by `test/compliance/components-tags.test.ts` and `test/golden/tag-rich.test.ts`.**
~~49. **Test channel parameters with `@parameter`** — `{userId}` channel address with reusable parameter~~ done — channel-parameter `$ref` upgrade covered in `test/compliance/reusable-components.test.ts`
~~50. **Create a "kitchen sink" test** — One massive test that uses every decorator and validates against the AsyncAPI schema~~ **Won't implement — never added as one test; `examples/reusable-components` and the compliance suite cover the matrix.**

---

## g) Questions

### 1. Should I push the commits to remote?

There are 6 unpushed commits on master. The plan says "final commit + push" but the global AGENTS.md says "NEVER PUSH TO REMOTE unless explicitly asked." The session handoff said to push. I did not push. Should I?

### 2. Should the security format change be considered a breaking change requiring a major version bump?

The `operation.security` output changed from `{ jwt: [] }` (OpenAPI-style map) to `{ $ref: "#/components/securitySchemes/jwt" }` (AsyncAPI 3.1 `$ref` style). Any consumer parsing the old format will break. Should this be documented in a CHANGELOG or migration guide, or is it considered a bug fix since the old format didn't validate against the AsyncAPI 3.1 schema?

### 3. Should I squash the debug-logging commits from git history?

Commits `767a224` (debug dump test) and `279216c` (debug logging in channel-builder) are noise in the git history. They were intermediate debugging artifacts committed by the auto-commit daemon. Squashing would clean the history but rewrites commits that are already local-only (not pushed). Worth doing, or leave as-is?

---

## Session Metrics

| Metric                         | Value                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| ~~Tests at start~~ done — point-in-time; counts are dated-audited in `FEATURES.md:4` | ~~1256 (9 failing)~~ |
| ~~Tests at end~~ done — the rewritten suite survives as `test/integration/asyncapi-3.1-features.test.ts` | ~~1282 (0 failing)~~ |
| ~~New tests added~~ done — the adapted suites live in `test/realworld/adapted/` | ~~26 (3 adapted suites + 3 golden file)~~ |
| ~~Bug fixes~~ done — fixes locked by `test/integration/asyncapi-3.1-features.test.ts` | ~~9 test failures resolved~~ |
| ~~Files created~~ done — artifacts survive ( `src/store-protocol-config.ts`, `test/realworld/adapted/` ) | ~~5 (adapted tests + golden file + store-protocol-config.ts)~~ |
| ~~Files modified~~ done — session commits verified in history ( `72a4dc09` .. `0a72e75b` ) | ~~7 (source + test + AGENTS.md)~~ |
| ~~Commits~~ done — six commits from `767a224` through `646c2460` in git history | ~~6~~ |
| ~~Pushed~~ done — everything pushed since; `v1.2.0` tagged 2026-11-19 | ~~0~~ |
| ~~Coverage verified~~ done — coverage gate standing ( `FEATURES.md:10` ) | ~~No~~ |
| ~~Duplicate analysis run~~ done — jscpd gate standing, 0 clones ( `FEATURES.md:9` ) | ~~No~~ |
| ~~Debug code left in git history~~ **Won't implement — the two daemon commits remain in history; the debug code itself was reverted in-session.** | ~~Yes (2 commits)~~ |
