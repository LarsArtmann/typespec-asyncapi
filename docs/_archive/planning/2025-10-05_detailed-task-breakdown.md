# Detailed Task Breakdown - 12 Minute Increments

**Date:** 2025-10-05T00:37:09Z
**Breakdown of:** 36 tasks into 60 micro-tasks (≤12 min each)

---

## PHASE 1: QUICK WINS (21 micro-tasks, ~150 minutes)

### TASK 1: Fix plugin-system.test.ts (3 micro-tasks, 30min)

| #   | Micro-Task                                        | Time  | Action                    | File                                  | Lines |
| --- | ------------------------------------------------- | ----- | ------------------------- | ------------------------------------- | ----- |
| 1.1 | Read plugin-system.test.ts and understand failure | 10min | Analyze test expectations | test/unit/plugin-system.test.ts       | 0     |
| 1.2 | Update test to expect auto-registered plugins     | 12min | Change assertions         | test/unit/plugin-system.test.ts:67-74 | ~8    |
| 1.3 | Run tests and commit if passing                   | 8min  | Verify + git commit       | -                                     | 0     |

### TASK 2: Fix options.test.ts schema (4 micro-tasks, 45min)

| #   | Micro-Task                                      | Time  | Action                       | File                                        | Lines |
| --- | ----------------------------------------------- | ----- | ---------------------------- | ------------------------------------------- | ----- |
| 2.1 | Read ASYNC_API_EMITTER_OPTIONS_SCHEMA structure | 10min | Understand Effect.TS schema  | src/infrastructure/configuration/options.ts | 0     |
| 2.2 | Update test property expectations               | 12min | Fix toBe Property assertions | test/unit/options.test.ts:200-223           | ~15   |
| 2.3 | Fix enum expectations for Effect schema         | 12min | Update enum access pattern   | test/unit/options.test.ts:220-222           | ~10   |
| 2.4 | Run tests and commit if passing                 | 11min | Verify + git commit          | -                                           | 0     |

### TASK 3: Fix emitter-core.test.ts paths (5 micro-tasks, 60min)

| #   | Micro-Task                                      | Time  | Action                           | File                                   | Lines |
| --- | ----------------------------------------------- | ----- | -------------------------------- | -------------------------------------- | ----- |
| 3.1 | Run single test and capture actual output paths | 10min | Debug file locations             | test/unit/emitter-core.test.ts         | 0     |
| 3.2 | Update JSON output test expectations            | 12min | Fix file path assertions         | test/unit/emitter-core.test.ts:105-108 | ~5    |
| 3.3 | Update YAML output test expectations            | 12min | Fix file path assertions         | test/unit/emitter-core.test.ts:120-125 | ~5    |
| 3.4 | Update default format test expectations         | 12min | Fix file path assertions         | test/unit/emitter-core.test.ts:136-141 | ~5    |
| 3.5 | Update default filename test + commit           | 14min | Fix assertions + verify + commit | test/unit/emitter-core.test.ts:147-152 | ~5    |

### TASK 4: Replace validateAsyncAPIStructure (4 micro-tasks, 45min)

| #   | Micro-Task                                          | Time  | Action                               | File                            | Lines    |
| --- | --------------------------------------------------- | ----- | ------------------------------------ | ------------------------------- | -------- |
| 4.1 | Create parseValidation.ts utility                   | 12min | New file with Parser.parse() wrapper | test/utils/parser-validation.ts | +40      |
| 4.2 | Replace validateAsyncAPIStructure() calls (3 files) | 12min | Import new utility                   | test/ files                     | -15, +15 |
| 4.3 | Mark old function as deprecated                     | 10min | Add @deprecated JSDoc                | test/utils/test-helpers.ts:714  | +3       |
| 4.4 | Run tests and commit if passing                     | 11min | Verify + git commit                  | -                               | 0        |

### TASK 5: Simplify hasValidStructure (3 micro-tasks, 30min)

| #   | Micro-Task                      | Time  | Action                       | File                                | Lines   |
| --- | ------------------------------- | ----- | ---------------------------- | ----------------------------------- | ------- |
| 5.1 | Refactor to use Parser.parse()  | 12min | Replace 54 lines with parser | test/utils/test-helpers.ts:980-1033 | -40, +8 |
| 5.2 | Keep Alpha-compatible fallback  | 8min  | Preserve fallback if needed  | test/utils/test-helpers.ts          | +5      |
| 5.3 | Run tests and commit if passing | 10min | Verify + git commit          | -                                   | 0       |

### TASK 6: Extract hardcoded paths (4 micro-tasks, 45min)

| #   | Micro-Task                                   | Time  | Action               | File                               | Lines    |
| --- | -------------------------------------------- | ----- | -------------------- | ---------------------------------- | -------- |
| 6.1 | Create test-constants.ts file                | 10min | New constants file   | test/utils/test-constants.ts       | +50      |
| 6.2 | Extract TEST_OUTPUT_PATHS constants          | 12min | Move hardcoded paths | test/utils/test-helpers.ts:394-496 | -20, +10 |
| 6.3 | Update test files to use constants (5 files) | 12min | Import and replace   | test/ files                        | ~30      |
| 6.4 | Run tests and commit if passing              | 11min | Verify + git commit  | -                                  | 0        |

---

## PHASE 2: DOMAIN TESTS (25 micro-tasks, ~400 minutes)

### TASKS 7-11: Add 25 domain tests (5 x 5 micro-tasks, 5 x 90min = 450min)

Each domain test category follows same pattern:

| #   | Micro-Task                          | Time  | Action                    | File                   | Lines |
| --- | ----------------------------------- | ----- | ------------------------- | ---------------------- | ----- |
| X.1 | Research domain requirements        | 12min | Understand business logic | -                      | 0     |
| X.2 | Create test file structure          | 12min | New describe blocks       | test/domain/\*.test.ts | +30   |
| X.3 | Write 3 positive test cases         | 30min | Happy path scenarios      | test/domain/\*.test.ts | +90   |
| X.4 | Write 2 negative test cases         | 24min | Error scenarios           | test/domain/\*.test.ts | +60   |
| X.5 | Run tests and commit if all passing | 12min | Verify + git commit       | -                      | 0     |

**TASK 7:** Channel Behavior Tests (test/domain/channel-behavior.test.ts, +180 lines)
**TASK 8:** Message Transformation Tests (test/domain/message-transform.test.ts, +180 lines)
**TASK 9:** Server Configuration Tests (test/domain/server-config.test.ts, +180 lines)
**TASK 10:** Security Schemes Tests (test/domain/security-schemes.test.ts, +180 lines)
**TASK 11:** Multi-Tenant Routing Tests (test/domain/multi-tenant.test.ts, +180 lines)

### TASK 12: Delete Alpha fallback (3 micro-tasks, 60min)

| #    | Micro-Task                                     | Time  | Action                      | File                       | Lines |
| ---- | ---------------------------------------------- | ----- | --------------------------- | -------------------------- | ----- |
| 12.1 | Identify all Alpha fallback usage              | 12min | Grep and analyze            | test/ files                | 0     |
| 12.2 | Delete fallback logic from compileAsyncAPISpec | 12min | Remove lines 222-317        | test/utils/test-helpers.ts | -95   |
| 12.3 | Update tests to expect real failures + commit  | 36min | Fix tests + verify + commit | test/ files                | ~20   |

---

## PHASE 3: CRITICAL PATH (11 micro-tasks, ~210 minutes)

### TASK 13: Research ValidationService (3 micro-tasks, 30min)

| #    | Micro-Task                                | Time  | Action                        | File                                           | Lines   |
| ---- | ----------------------------------------- | ----- | ----------------------------- | ---------------------------------------------- | ------- |
| 13.1 | Read DocumentBuilder.ts working pattern   | 10min | Understand Effect.gen binding | src/domain/emitter/DocumentBuilder.ts          | 0       |
| 13.2 | Read ValidationService.ts failing pattern | 10min | Identify `this` context loss  | src/domain/validation/ValidationService.ts:149 | 0       |
| 13.3 | Document pattern differences              | 10min | Create fix strategy           | docs/analysis/                                 | +1 file |

### TASK 14: Fix ValidationService binding (8 micro-tasks, 90min)

| #    | Micro-Task                                          | Time  | Action                          | File                                           | Lines |
| ---- | --------------------------------------------------- | ----- | ------------------------------- | ---------------------------------------------- | ----- |
| 14.1 | Extract validateDocument to standalone Effect       | 12min | Create helper function          | src/domain/validation/ValidationService.ts     | +15   |
| 14.2 | Update validateDocumentContent to use helper        | 10min | Replace `this.validateDocument` | src/domain/validation/ValidationService.ts:149 | ~5    |
| 14.3 | Test validateDocumentContent with valid JSON        | 10min | Run single test                 | test/unit/core/ValidationService.test.ts:238   | 0     |
| 14.4 | Test validateDocumentContent with invalid JSON      | 10min | Run single test                 | test/unit/core/ValidationService.test.ts:257   | 0     |
| 14.5 | Test validateDocumentContent with validation errors | 10min | Run single test                 | test/unit/core/ValidationService.test.ts:265   | 0     |
| 14.6 | Test validateDocumentContent with empty content     | 10min | Run single test                 | test/unit/core/ValidationService.test.ts:276   | 0     |
| 14.7 | Update other ValidationService methods              | 18min | Apply pattern to all methods    | src/domain/validation/ValidationService.ts     | ~40   |
| 14.8 | Run all ValidationService tests + commit            | 10min | Verify + git commit             | -                                              | 0     |

### TASK 15: Fix remaining validation tests (No additional micro-tasks - covered in 14.3-14.6)

---

## PHASE 4: VALIDATION IMPROVEMENTS (8 micro-tasks, ~150 minutes)

### TASK 16: Add ValidationService unit tests (7 micro-tasks, 90min)

| #    | Micro-Task                              | Time  | Action              | File                                     | Lines |
| ---- | --------------------------------------- | ----- | ------------------- | ---------------------------------------- | ----- |
| 16.1 | Test constructor and initialization     | 12min | New test case       | test/unit/core/ValidationService.test.ts | +25   |
| 16.2 | Test cache behavior                     | 12min | New test case       | test/unit/core/ValidationService.test.ts | +30   |
| 16.3 | Test error handling paths               | 12min | New test case       | test/unit/core/ValidationService.test.ts | +25   |
| 16.4 | Test validateEffect() method            | 12min | New test case       | test/unit/core/ValidationService.test.ts | +20   |
| 16.5 | Test edge cases (null, undefined, etc.) | 12min | New test case       | test/unit/core/ValidationService.test.ts | +30   |
| 16.6 | Test performance with large documents   | 12min | New test case       | test/unit/core/ValidationService.test.ts | +20   |
| 16.7 | Run all tests + commit                  | 18min | Verify + git commit | -                                        | 0     |

### TASK 17: Replace manual diagnostics (5 micro-tasks, 60min)

| #    | Micro-Task                                     | Time  | Action                  | File                           | Lines   |
| ---- | ---------------------------------------------- | ----- | ----------------------- | ------------------------------ | ------- |
| 17.1 | Identify manual diagnostic filtering (3 files) | 10min | Grep for `.filter(d =>` | test/ files                    | 0       |
| 17.2 | Replace with Parser.validate() in test-helpers | 12min | Update helper function  | test/utils/test-helpers.ts     | -15, +5 |
| 17.3 | Replace in emitter tests                       | 12min | Update test files       | test/unit/emitter-core.test.ts | -10, +5 |
| 17.4 | Replace in validation tests                    | 12min | Update test files       | test/validation/\*.test.ts     | -15, +5 |
| 17.5 | Run affected tests + commit                    | 14min | Verify + git commit     | -                              | 0       |

---

## PHASE 5: MODERNIZATION (6 micro-tasks, ~180 minutes)

### TASK 18: Migrate to createTester() (8 micro-tasks, 90min)

| #    | Micro-Task                        | Time  | Action                  | File                                         | Lines |
| ---- | --------------------------------- | ----- | ----------------------- | -------------------------------------------- | ----- |
| 18.1 | Read createTester() documentation | 10min | Understand modern API   | -                                            | 0     |
| 18.2 | Create AsyncAPITester singleton   | 12min | New utility             | test/utils/modern-tester.ts                  | +30   |
| 18.3 | Migrate 1 simple test file        | 12min | Replace compile pattern | test/integration/basic-functionality.test.ts | ~15   |
| 18.4 | Verify migrated test passes       | 10min | Run test                | -                                            | 0     |
| 18.5 | Migrate 3 more test files         | 30min | Apply pattern           | test/integration/\*.test.ts                  | ~45   |
| 18.6 | Migrate 2 unit test files         | 12min | Apply pattern           | test/unit/\*.test.ts                         | ~30   |
| 18.7 | Document migration pattern        | 10min | Add JSDoc + examples    | test/utils/modern-tester.ts                  | +20   |
| 18.8 | Run all migrated tests + commit   | 14min | Verify + git commit     | -                                            | 0     |

### TASK 19: Add expectDiagnostics() (4 micro-tasks, 45min)

| #    | Micro-Task                                  | Time  | Action                 | File        | Lines    |
| ---- | ------------------------------------------- | ----- | ---------------------- | ----------- | -------- |
| 19.1 | Import expectDiagnostics helper             | 10min | Add imports (5 files)  | test/ files | +5       |
| 19.2 | Replace manual diagnostic checks (10 tests) | 20min | Use expect Diagnostics | test/ files | -20, +20 |
| 19.3 | Add negative diagnostic tests (5 tests)     | 12min | Test expected errors   | test/ files | +30      |
| 19.4 | Run tests + commit                          | 13min | Verify + git commit    | -           | 0        |

### TASK 20: Extract TestSources to fixtures (8 micro-tasks, 90min)

| #    | Micro-Task                                   | Time  | Action                   | File                                  | Lines    |
| ---- | -------------------------------------------- | ----- | ------------------------ | ------------------------------------- | -------- |
| 20.1 | Create test/fixtures directory               | 10min | New directory structure  | test/fixtures/                        | 0        |
| 20.2 | Move basicEvent to fixture file              | 10min | Create .tsp file         | test/fixtures/basic-event.tsp         | +10      |
| 20.3 | Move complexEvent to fixture file            | 10min | Create .tsp file         | test/fixtures/complex-event.tsp       | +15      |
| 20.4 | Move multipleOperations to fixture file      | 10min | Create .tsp file         | test/fixtures/multiple-operations.tsp | +20      |
| 20.5 | Move withDocumentation to fixture file       | 10min | Create .tsp file         | test/fixtures/with-documentation.tsp  | +12      |
| 20.6 | Move unionTypes to fixture file              | 10min | Create .tsp file         | test/fixtures/union-types.tsp         | +8       |
| 20.7 | Update test files to load fixtures (8 files) | 20min | Replace TestSources      | test/ files                           | -50, +30 |
| 20.8 | Delete TestSources object + commit           | 10min | Remove + verify + commit | test/utils/test-helpers.ts:793-900    | -107     |

---

## PHASE 6: CLEANUP & CONSOLIDATION (8 micro-tasks, ~150 minutes)

### TASK 21: Consolidate TestLogging (4 micro-tasks, 45min)

| #    | Micro-Task                                  | Time  | Action                   | File                               | Lines   |
| ---- | ------------------------------------------- | ----- | ------------------------ | ---------------------------------- | ------- |
| 21.1 | Create unified logging utility              | 12min | New helper               | test/utils/test-logging.ts         | +30     |
| 21.2 | Replace Effect.log in test-helpers          | 12min | Update imports           | test/utils/test-helpers.ts         | -20, +5 |
| 21.3 | Replace Effect.log in test files (10 files) | 12min | Update calls             | test/ files                        | ~15     |
| 21.4 | Delete old TestLogging object + commit      | 9min  | Remove + verify + commit | test/utils/test-helpers.ts:906-933 | -27     |

### TASK 22: Add conformance tests (8 micro-tasks, 90min)

| #    | Micro-Task                           | Time  | Action                    | File                                       | Lines |
| ---- | ------------------------------------ | ----- | ------------------------- | ------------------------------------------ | ----- |
| 22.1 | Load AsyncAPI official examples      | 12min | Read from @asyncapi/specs | test/conformance/load-examples.ts          | +40   |
| 22.2 | Create conformance test suite        | 12min | New test file             | test/conformance/official-examples.test.ts | +50   |
| 22.3 | Test channel examples (5 examples)   | 12min | Validation tests          | test/conformance/official-examples.test.ts | +40   |
| 22.4 | Test operation examples (5 examples) | 12min | Validation tests          | test/conformance/official-examples.test.ts | +40   |
| 22.5 | Test message examples (5 examples)   | 12min | Validation tests          | test/conformance/official-examples.test.ts | +40   |
| 22.6 | Test server examples (3 examples)    | 10min | Validation tests          | test/conformance/official-examples.test.ts | +30   |
| 22.7 | Test security examples (3 examples)  | 10min | Validation tests          | test/conformance/official-examples.test.ts | +30   |
| 22.8 | Run all conformance tests + commit   | 10min | Verify + git commit       | -                                          | 0     |

---

## PHASE 7: REMAINING FIXES (6 micro-tasks, ~150 minutes)

### TASK 25: Fix remaining emitter tests (8 micro-tasks, 90min)

| #    | Micro-Task                                  | Time  | Action            | File                           | Lines |
| ---- | ------------------------------------------- | ----- | ----------------- | ------------------------------ | ----- |
| 25.1 | Run emitter-core tests and analyze failures | 10min | Identify patterns | test/unit/emitter-core.test.ts | 0     |
| 25.2 | Fix 2 error handling tests                  | 12min | Update assertions | test/unit/emitter-core.test.ts | ~10   |
| 25.3 | Fix 2 option processing tests               | 12min | Update assertions | test/unit/emitter-core.test.ts | ~10   |
| 25.4 | Fix 2 namespace tests                       | 12min | Update assertions | test/unit/emitter-core.test.ts | ~10   |
| 25.5 | Fix 2 schema generation tests               | 12min | Update assertions | test/unit/emitter-core.test.ts | ~10   |
| 25.6 | Fix 2 operation tests                       | 12min | Update assertions | test/unit/emitter-core.test.ts | ~10   |
| 25.7 | Run all emitter tests                       | 10min | Verify passing    | -                              | 0     |
| 25.8 | Commit if all passing                       | 10min | Git commit        | -                              | 0     |

### TASK 26: Fix validation framework tests (8 micro-tasks, 90min)

| #    | Micro-Task                                | Time  | Action            | File                                              | Lines |
| ---- | ----------------------------------------- | ----- | ----------------- | ------------------------------------------------- | ----- |
| 26.1 | Run validation tests and analyze failures | 10min | Identify patterns | test/validation/\*.test.ts                        | 0     |
| 26.2 | Fix 3 spec validation tests               | 12min | Update assertions | test/validation/automated-spec-validation.test.ts | ~15   |
| 26.3 | Fix 3 error detection tests               | 12min | Update assertions | test/validation/automated-spec-validation.test.ts | ~15   |
| 26.4 | Fix 3 batch validation tests              | 12min | Update assertions | test/validation/automated-spec-validation.test.ts | ~15   |
| 26.5 | Fix 3 cache tests                         | 12min | Update assertions | test/validation/\*.test.ts                        | ~15   |
| 26.6 | Fix 3 performance tests                   | 12min | Update assertions | test/validation/\*.test.ts                        | ~15   |
| 26.7 | Run all validation tests                  | 10min | Verify passing    | -                                                 | 0     |
| 26.8 | Commit if all passing                     | 10min | Git commit        | -                                                 | 0     |

---

## PHASE 8: ADVANCED TESTING (8 micro-tasks, ~90 minutes)

### TASK 27: Add property-based tests (8 micro-tasks, 90min)

| #    | Micro-Task                                         | Time  | Action              | File                                      | Lines |
| ---- | -------------------------------------------------- | ----- | ------------------- | ----------------------------------------- | ----- |
| 27.1 | Install fast-check dependency                      | 10min | bun add             | package.json                              | +1    |
| 27.2 | Create property test utilities                     | 12min | Generators          | test/utils/property-generators.ts         | +50   |
| 27.3 | Property test: AsyncAPI version always 3.0.0       | 10min | Test invariant      | test/property/asyncapi-invariants.test.ts | +25   |
| 27.4 | Property test: Channels always have operations     | 10min | Test invariant      | test/property/asyncapi-invariants.test.ts | +25   |
| 27.5 | Property test: Operations reference valid channels | 10min | Test invariant      | test/property/asyncapi-invariants.test.ts | +25   |
| 27.6 | Property test: Messages have valid schemas         | 10min | Test invariant      | test/property/asyncapi-invariants.test.ts | +25   |
| 27.7 | Property test: Generated doc always parses         | 10min | Test invariant      | test/property/asyncapi-invariants.test.ts | +30   |
| 27.8 | Run property tests + commit                        | 18min | Verify + git commit | -                                         | 0     |

---

## PHASE 9: ORGANIZATION (8 micro-tasks, ~150 minutes)

### TASK 28: Create test data factories (5 micro-tasks, 60min)

| #    | Micro-Task                            | Time  | Action           | File                         | Lines    |
| ---- | ------------------------------------- | ----- | ---------------- | ---------------------------- | -------- |
| 28.1 | Create factory pattern utilities      | 12min | New file         | test/utils/test-factories.ts | +40      |
| 28.2 | Replace hardcoded test data (5 files) | 24min | Use factories    | test/ files                  | -30, +30 |
| 28.3 | Add factory variations (10 variants)  | 12min | Extend factories | test/utils/test-factories.ts | +50      |
| 28.4 | Run tests with factories              | 10min | Verify passing   | -                            | 0        |
| 28.5 | Commit factory implementation         | 12min | Git commit       | -                            | 0        |

### TASK 29: Extract constants (5 micro-tasks, 60min)

| #    | Micro-Task                     | Time  | Action              | File                | Lines |
| ---- | ------------------------------ | ----- | ------------------- | ------------------- | ----- |
| 29.1 | Create centralized config file | 10min | New file            | test/test.config.ts | +30   |
| 29.2 | Move ASYNCAPI_VERSIONS         | 10min | Extract constant    | test/test.config.ts | +5    |
| 29.3 | Move TEST_NAMESPACES           | 10min | Extract constant    | test/test.config.ts | +10   |
| 29.4 | Update imports (15 files)      | 20min | Replace constants   | test/ files         | ~50   |
| 29.5 | Run tests + commit             | 10min | Verify + git commit | -                   | 0     |

### TASK 30: Remove deprecated code (3 micro-tasks, 30min)

| #    | Micro-Task                         | Time  | Action              | File                               | Lines |
| ---- | ---------------------------------- | ----- | ------------------- | ---------------------------------- | ----- |
| 30.1 | Delete validateAsyncAPIStructure() | 10min | Remove function     | test/utils/test-helpers.ts:714-743 | -50   |
| 30.2 | Delete is AsyncAPIDocument() guard | 10min | Remove function     | test/utils/test-helpers.ts:699-708 | -10   |
| 30.3 | Run tests + commit                 | 10min | Verify + git commit | -                                  | 0     |

---

## PHASE 10: DOCUMENTATION (11 micro-tasks, ~150 minutes)

### TASK 23: Current architecture diagram (5 micro-tasks, 60min)

| #    | Micro-Task                            | Time  | Action            | File                                                   | Lines   |
| ---- | ------------------------------------- | ----- | ----------------- | ------------------------------------------------------ | ------- |
| 23.1 | Research current emitter architecture | 12min | Read code         | src/domain/emitter/                                    | 0       |
| 23.2 | Map Effect.TS service structure       | 12min | Document services | -                                                      | 0       |
| 23.3 | Map plugin system architecture        | 12min | Document plugins  | -                                                      | 0       |
| 23.4 | Create mermaid diagram                | 12min | Write diagram     | docs/architecture-understanding/2025-10-05-current.mmd | +1 file |
| 23.5 | Verify diagram accuracy               | 12min | Review            | -                                                      | 0       |

### TASK 24: Desired architecture diagram (5 micro-tasks, 60min)

| #    | Micro-Task                         | Time  | Action                 | File                                                   | Lines   |
| ---- | ---------------------------------- | ----- | ---------------------- | ------------------------------------------------------ | ------- |
| 24.1 | Identify architecture improvements | 12min | Analyze pain points    | -                                                      | 0       |
| 24.2 | Design simplified plugin system    | 12min | Document ideal state   | -                                                      | 0       |
| 24.3 | Design reduced service count       | 12min | Document consolidation | -                                                      | 0       |
| 24.4 | Create mermaid diagram             | 12min | Write diagram          | docs/architecture-understanding/2025-10-05-desired.mmd | +1 file |
| 24.5 | Compare current vs desired         | 12min | Document gaps          | -                                                      | 0       |

### TASK 31: Document learnings (4 micro-tasks, 45min)

| #    | Micro-Task                          | Time  | Action                | File                                 | Lines |
| ---- | ----------------------------------- | ----- | --------------------- | ------------------------------------ | ----- |
| 31.1 | Document ghost systems found        | 10min | Write analysis        | docs/learnings/2025-10-05-session.md | +50   |
| 31.2 | Document split brains found         | 10min | Write analysis        | docs/learnings/2025-10-05-session.md | +30   |
| 31.3 | Document lies/assumptions corrected | 10min | Write analysis        | docs/learnings/2025-10-05-session.md | +40   |
| 31.4 | Document success patterns           | 15min | Write recommendations | docs/learnings/2025-10-05-session.md | +50   |

### TASK 32: Create reusable prompts (4 micro-tasks, 45min)

| #    | Micro-Task                              | Time  | Action           | File                                        | Lines |
| ---- | --------------------------------------- | ----- | ---------------- | ------------------------------------------- | ----- |
| 32.1 | Extract "Test Recovery" prompt          | 10min | Create template  | docs/prompts/2025-10-05-test-recovery.md    | +50   |
| 32.2 | Extract "Ghost System Detection" prompt | 10min | Create template  | docs/prompts/2025-10-05-ghost-detection.md  | +40   |
| 32.3 | Extract "Library Research" prompt       | 10min | Create template  | docs/prompts/2025-10-05-library-research.md | +40   |
| 32.4 | Create prompt index                     | 15min | List all prompts | docs/prompts/README.md                      | +30   |

### TASK 33: Update README (3 micro-tasks, 30min)

| #    | Micro-Task                  | Time  | Action              | File            | Lines |
| ---- | --------------------------- | ----- | ------------------- | --------------- | ----- |
| 33.1 | Add test instructions       | 10min | Document `bun test` | README.md       | +20   |
| 33.2 | Add architecture references | 10min | Link to diagrams    | README.md       | +15   |
| 33.3 | Add contribution guidelines | 10min | Test-first workflow | CONTRIBUTING.md | +30   |

---

## PHASE 11: CI/CD & METRICS (8 micro-tasks, ~150 minutes)

### TASK 34: Add CI test validation (6 micro-tasks, 60min)

| #    | Micro-Task                     | Time  | Action             | File                       | Lines |
| ---- | ------------------------------ | ----- | ------------------ | -------------------------- | ----- |
| 34.1 | Create GitHub Actions workflow | 10min | New file           | .github/workflows/test.yml | +40   |
| 34.2 | Add test step with bun         | 10min | Configure action   | .github/workflows/test.yml | +10   |
| 34.3 | Add test coverage reporting    | 10min | Add coverage       | .github/workflows/test.yml | +15   |
| 34.4 | Add failure notifications      | 10min | Configure alerts   | .github/workflows/test.yml | +10   |
| 34.5 | Test workflow locally          | 10min | Act or manual test | -                          | 0     |
| 34.6 | Commit workflow                | 10min | Git commit         | -                          | 0     |

### TASK 35: Create test coverage report (6 micro-tasks, 45min)

| #    | Micro-Task                     | Time  | Action                    | File                        | Lines |
| ---- | ------------------------------ | ----- | ------------------------- | --------------------------- | ----- |
| 35.1 | Configure bun test coverage    | 10min | Update test scripts       | package.json                | +2    |
| 35.2 | Generate coverage report       | 10min | Run `bun test --coverage` | -                           | 0     |
| 35.3 | Create coverage summary script | 10min | Parse coverage            | scripts/coverage-summary.ts | +50   |
| 35.4 | Add coverage to git ignore     | 5min  | Update .gitignore         | .gitignore                  | +2    |
| 35.5 | Document coverage goals        | 5min  | Add to docs               | docs/testing/coverage.md    | +30   |
| 35.6 | Commit coverage setup          | 5min  | Git commit                | -                           | 0     |

### TASK 36: Final cleanup and verification (5 micro-tasks, 60min)

| #    | Micro-Task                  | Time  | Action               | File | Lines |
| ---- | --------------------------- | ----- | -------------------- | ---- | ----- |
| 36.1 | Run full test suite         | 12min | `bun test`           | -    | 0     |
| 36.2 | Verify test pass rate ≥ 90% | 10min | Check results        | -    | 0     |
| 36.3 | Run ESLint verification     | 10min | `bunx eslint src`    | -    | 0     |
| 36.4 | Run build verification      | 10min | `bun run build`      | -    | 0     |
| 36.5 | Final commit + push         | 18min | Git push all changes | -    | 0     |

---

## SUMMARY TABLE

| Phase                        | Micro-Tasks   | Total Time          | Tests Impact   | Lines Changed   |
| ---------------------------- | ------------- | ------------------- | -------------- | --------------- |
| **Phase 1: Quick Wins**      | 21            | 150min (2.5h)       | +15 passing    | +25, -95        |
| **Phase 2: Domain Tests**    | 25            | 450min (7.5h)       | +25 passing    | +900            |
| **Phase 3: Critical Path**   | 11            | 210min (3.5h)       | +20 passing    | +60, -0         |
| **Phase 4: Validation**      | 13            | 150min (2.5h)       | +10 passing    | +200, -30       |
| **Phase 5: Modernization**   | 20            | 225min (3.8h)       | +5 passing     | +175, -130      |
| **Phase 6: Cleanup**         | 16            | 240min (4.0h)       | +20 passing    | +400, -134      |
| **Phase 7: Remaining Fixes** | 16            | 180min (3.0h)       | +20 passing    | +80, -0         |
| **Phase 8: Advanced**        | 8             | 90min (1.5h)        | +5 passing     | +200            |
| **Phase 9: Organization**    | 13            | 150min (2.5h)       | 0 passing      | +120, -90       |
| **Phase 10: Documentation**  | 19            | 180min (3.0h)       | 0 passing      | +5 files        |
| **Phase 11: CI/CD**          | 17            | 165min (2.8h)       | 0 passing      | +150, -0        |
| **TOTAL**                    | **179 tasks** | **2190min (36.5h)** | **+120 tests** | **+2310, -479** |

---

## PRIORITY SORTED VIEW

| Priority          | Tasks    | Time  | Expected Outcome                             |
| ----------------- | -------- | ----- | -------------------------------------------- |
| **P0 (DO FIRST)** | 18 tasks | 5.5h  | ValidationService fixed, basic tests passing |
| **P1 (DO NEXT)**  | 89 tasks | 20.5h | 90%+ pass rate, domain tests added           |
| **P2 (DO AFTER)** | 60 tasks | 9.0h  | Cleanup complete, modern patterns            |
| **P3 (DO LAST)**  | 12 tasks | 1.5h  | Documentation polished                       |

---

## GIT COMMIT SCHEDULE

**179 micro-tasks = ~90 commits** (commit every 2 micro-tasks or at task completion)

Each commit message follows format:

```
<type>(test): <micro-task-description>

Task X.Y: <full-task-name>

Changes:
- <specific-change>

Impact:
- Tests: <before> → <after>
- Lines: <+added/-deleted>

Time: <minutes>

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Created by:** Claude (Sonnet 4.5)
**Total Planning Time:** 45 minutes
**Expected Execution Time:** 36.5 hours across 5 days
**Success Criteria:** 90%+ test pass rate, zero ghost systems, full documentation
