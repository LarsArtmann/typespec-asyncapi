# Task Breakdown: 15-Minute Micro-Tasks

**Total Tasks:** 97
**Total Estimated Time:** 24.5 hours
**Sorted By:** Impact → Effort ratio (highest ROI first)

---

## Micro-Task Table (Sorted by Priority)

| #                                              | Task                                                          | Parent     | Est.  | Impact     | ROI | Status |
| ---------------------------------------------- | ------------------------------------------------------------- | ---------- | ----- | ---------- | --- | ------ |
| **PHASE 1: THE 1% - CRITICAL PATH (45min)**    |                                                               |            |       |            |     |        |
| 1                                              | Read test/utils/test-helpers.ts lines 936-957                 | Fix Helper | 5min  | 🔥🔥🔥🔥🔥 | 5.0 | ⏳     |
| 2                                              | Identify file matching bug in compileAndGetAsyncAPI           | Fix Helper | 10min | 🔥🔥🔥🔥🔥 | 5.0 | ⏳     |
| 3                                              | Fix file path matching to find tsp-output AsyncAPI files      | Fix Helper | 10min | 🔥🔥🔥🔥🔥 | 5.0 | ⏳     |
| 4                                              | Test helper fix with single security test                     | Fix Helper | 5min  | 🔥🔥🔥🔥🔥 | 5.0 | ⏳     |
| 5                                              | Run full test suite to measure helper fix impact              | Verify     | 15min | 🔥🔥🔥🔥🔥 | 5.0 | ⏳     |
| **PHASE 2: THE 4% - QUICK WINS (3h 45min)**    |                                                               |            |       |            |     |        |
| 6                                              | Read test/e2e/debug-emitter.test.ts                           | Fix Import | 3min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 7                                              | Fix Effect.log import in debug-emitter.test.ts                | Fix Import | 7min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 8                                              | Read test/e2e/direct-emitter.test.ts                          | Fix Import | 3min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 9                                              | Fix Effect.log import in direct-emitter.test.ts               | Fix Import | 7min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 10                                             | Read test/e2e/real-emitter.test.ts                            | Fix Import | 3min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 11                                             | Fix Effect.log import in real-emitter.test.ts                 | Fix Import | 7min  | 🔥🔥🔥     | 3.0 | ⏳     |
| 12                                             | Run E2E tests to verify import fixes                          | Verify     | 10min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 13                                             | Run full test suite after quick wins                          | Verify     | 15min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 14                                             | Run security tests and capture error output                   | Analysis   | 10min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 15                                             | Run Kafka tests and capture error output                      | Analysis   | 10min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 16                                             | Run WebSocket/MQTT tests and capture error output             | Analysis   | 10min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 17                                             | Identify tests with TypeSpec diagnostics (compilation errors) | Analysis   | 15min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 18                                             | Fix TypeSpec error #1 (invalid decorator usage)               | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 19                                             | Fix TypeSpec error #2 (reserved keyword)                      | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 20                                             | Fix TypeSpec error #3 (invalid record syntax)                 | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 21                                             | Fix TypeSpec error #4 (missing import)                        | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 22                                             | Fix TypeSpec error #5 (type mismatch)                         | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 23                                             | Verify first 5 TypeSpec fixes with test run                   | Verify     | 10min | 🔥🔥🔥     | 3.0 | ⏳     |
| 24                                             | Fix TypeSpec error #6 (decorator parameter)                   | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 25                                             | Fix TypeSpec error #7 (namespace issue)                       | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 26                                             | Fix TypeSpec error #8 (model property)                        | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 27                                             | Fix TypeSpec error #9 (operation signature)                   | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 28                                             | Fix TypeSpec error #10 (channel decorator)                    | Fix Syntax | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 29                                             | Verify next 5 TypeSpec fixes with test run                    | Verify     | 10min | 🔥🔥🔥     | 3.0 | ⏳     |
| 30                                             | Fix TypeSpec error #11-15 (batch remaining)                   | Fix Syntax | 15min | 🔥🔥       | 1.3 | ⏳     |
| 31                                             | Fix TypeSpec error #16-20 (batch remaining)                   | Fix Syntax | 15min | 🔥🔥       | 1.3 | ⏳     |
| 32                                             | Fix TypeSpec error #21-26 (final batch)                       | Fix Syntax | 10min | 🔥🔥       | 1.3 | ⏳     |
| 33                                             | Verify all TypeSpec fixes with full test run                  | Verify     | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 34                                             | Create docs/emitter-feature-matrix.md skeleton                | Docs       | 10min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 35                                             | Document implemented HTTP auth schemes                        | Docs       | 10min | 🔥🔥🔥     | 3.0 | ⏳     |
| 36                                             | Document implemented API key schemes                          | Docs       | 10min | 🔥🔥🔥     | 3.0 | ⏳     |
| 37                                             | Document unimplemented security schemes                       | Docs       | 15min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 38                                             | Mark unsupported HTTP auth tests as .skip() (20 tests)        | Cleanup    | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 39                                             | Mark unsupported API key tests as .skip() (15 tests)          | Cleanup    | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 40                                             | Mark unsupported OAuth2 tests as .skip() (15 tests)           | Cleanup    | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 41                                             | Mark unsupported SASL tests as .skip() (10 tests)             | Cleanup    | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 42                                             | Mark unsupported Kafka tests as .skip() (20 tests)            | Cleanup    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 43                                             | Mark unsupported Kafka security tests as .skip() (10 tests)   | Cleanup    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 44                                             | Mark unsupported WebSocket tests as .skip() (20 tests)        | Cleanup    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 45                                             | Mark unsupported MQTT tests as .skip() (15 tests)             | Cleanup    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 46                                             | Run test suite after cleanup                                  | Verify     | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| **PHASE 3: THE 20% - STRATEGIC (12h 30min)**   |                                                               |            |       |            |     |        |
| 47                                             | Analyze all 347 failing tests output                          | Analysis   | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 48                                             | Categorize failures: Helper bugs (group 1)                    | Analysis   | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 49                                             | Categorize failures: TypeSpec syntax (group 2)                | Analysis   | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 50                                             | Categorize failures: Missing features (group 3)               | Analysis   | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 51                                             | Categorize failures: Test bugs (group 4)                      | Analysis   | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 52                                             | Count tests in each category                                  | Analysis   | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 53                                             | Create docs/known-test-failures.md structure                  | Docs       | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 54                                             | Document helper bug failures                                  | Docs       | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 55                                             | Document syntax error failures                                | Docs       | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 56                                             | Document missing feature failures                             | Docs       | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 57                                             | Read src/decorators/security.ts                               | Feature    | 10min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 58                                             | Design SASL/PLAIN implementation approach                     | Feature    | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 59                                             | Implement SASL/PLAIN decorator parsing                        | Feature    | 30min | 🔥🔥🔥🔥   | 1.3 | ⏳     |
| 60                                             | Implement SASL/PLAIN AsyncAPI output                          | Feature    | 30min | 🔥🔥🔥🔥   | 1.3 | ⏳     |
| 61                                             | Add SASL/PLAIN to security scheme mapping                     | Feature    | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 62                                             | Test SASL/PLAIN with single test case                         | Feature    | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 63                                             | Write unit test for SASL/PLAIN decorator                      | Feature    | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 64                                             | Write integration test for SASL/PLAIN emitter                 | Feature    | 15min | 🔥🔥🔥     | 2.0 | ⏳     |
| 65                                             | Verify SASL/PLAIN tests pass                                  | Feature    | 15min | 🔥🔥🔥🔥   | 2.7 | ⏳     |
| 66                                             | Read OAuth2 specification                                     | Feature    | 15min | 🔥🔥🔥     | 1.0 | ⏳     |
| 67                                             | Design OAuth2 client credentials implementation               | Feature    | 15min | 🔥🔥🔥     | 1.0 | ⏳     |
| 68                                             | Implement OAuth2 decorator parameter parsing                  | Feature    | 30min | 🔥🔥🔥     | 1.0 | ⏳     |
| 69                                             | Implement OAuth2 flows property handling                      | Feature    | 30min | 🔥🔥🔥     | 1.0 | ⏳     |
| 70                                             | Implement OAuth2 AsyncAPI output                              | Feature    | 25min | 🔥🔥🔥     | 1.0 | ⏳     |
| 71                                             | Test OAuth2 with single test case                             | Feature    | 15min | 🔥🔥🔥     | 1.3 | ⏳     |
| 72                                             | Write unit test for OAuth2 decorator                          | Feature    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 73                                             | Write integration test for OAuth2 emitter                     | Feature    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 74                                             | Verify OAuth2 tests pass                                      | Feature    | 15min | 🔥🔥🔥     | 1.3 | ⏳     |
| 75                                             | Read WebSocket AsyncAPI specification                         | Feature    | 15min | 🔥🔥🔥     | 1.1 | ⏳     |
| 76                                             | Design WebSocket binding implementation                       | Feature    | 15min | 🔥🔥🔥     | 1.1 | ⏳     |
| 77                                             | Implement WebSocket protocol decorator parsing                | Feature    | 30min | 🔥🔥🔥     | 1.1 | ⏳     |
| 78                                             | Implement WebSocket binding properties                        | Feature    | 30min | 🔥🔥🔥     | 1.1 | ⏳     |
| 79                                             | Implement WebSocket AsyncAPI output                           | Feature    | 30min | 🔥🔥🔥     | 1.1 | ⏳     |
| 80                                             | Test WebSocket with single test case                          | Feature    | 15min | 🔥🔥🔥     | 1.3 | ⏳     |
| 81                                             | Write unit test for WebSocket protocol                        | Feature    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 82                                             | Write integration test for WebSocket emitter                  | Feature    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 83                                             | Verify WebSocket tests pass                                   | Feature    | 15min | 🔥🔥🔥     | 1.3 | ⏳     |
| 84                                             | Design validateSecurityScheme() helper API                    | Utility    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 85                                             | Implement validateSecurityScheme() function                   | Utility    | 30min | 🔥🔥       | 1.3 | ⏳     |
| 86                                             | Design expectAsyncAPIValid() assertion API                    | Utility    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 87                                             | Implement expectAsyncAPIValid() function                      | Utility    | 15min | 🔥🔥       | 2.0 | ⏳     |
| 88                                             | Improve AsyncAPI file glob pattern matching                   | Utility    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 89                                             | Add error messages for missing AsyncAPI files                 | Utility    | 15min | 🔥🔥       | 1.3 | ⏳     |
| 90                                             | Add debug logging to helper function                          | Utility    | 15min | 🔥🔥       | 1.3 | ⏳     |
| **PHASE 4: POLISH & DOCUMENTATION (2h 10min)** |                                                               |            |       |            |     |        |
| 91                                             | Update CLAUDE.md with feature matrix section                  | Docs       | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 92                                             | Update CLAUDE.md with known limitations                       | Docs       | 15min | 🔥🔥🔥     | 3.0 | ⏳     |
| 93                                             | Update README.md with test coverage badge                     | Docs       | 10min | 🔥🔥       | 2.0 | ⏳     |
| 94                                             | Update README.md with feature highlights                      | Docs       | 10min | 🔥🔥       | 2.0 | ⏳     |
| 95                                             | Run full validation suite (all tests)                         | Verify     | 20min | 🔥🔥🔥🔥   | 4.0 | ⏳     |
| 96                                             | Capture final test metrics                                    | Verify     | 10min | 🔥🔥🔥     | 3.0 | ⏳     |
| 97                                             | Create final status report with metrics                       | Docs       | 30min | 🔥🔥🔥     | 3.0 | ⏳     |

---

## Summary by Phase

| Phase                | Tasks    | Total Time | Expected Impact |
| -------------------- | -------- | ---------- | --------------- |
| **Phase 1 (1%)**     | 1-5      | 45min      | 439 → 480 tests |
| **Phase 2 (4%)**     | 6-46     | 10h 15min  | 480 → 500 tests |
| **Phase 3 (20%)**    | 47-90    | 12h 30min  | 500 → 530 tests |
| **Phase 4 (Polish)** | 91-97    | 2h 10min   | Documentation   |
| **TOTAL**            | 97 tasks | ~25 hours  | 67%+ pass rate  |

---

## Execution Strategy

### Parallel Execution Opportunities

- Tasks 6-11 (E2E test fixes) can run in parallel
- Tasks 14-16 (test analysis) can run in parallel
- Tasks 18-22 (TypeSpec fixes) can run in parallel after analysis
- Tasks 38-45 (marking .skip()) can run in parallel
- Tasks 63-64, 72-73, 81-82 (writing tests) can run in parallel

### Critical Path (Must Be Sequential)

```
1 → 2 → 3 → 4 → 5 → 13 → 17 → [TypeSpec fixes] → 33 → 46 → [Analysis] → [Features] → 95 → 97
```

### Checkpoints (Verify Before Continuing)

- Task 5: Helper fix must work
- Task 13: Quick wins validated
- Task 33: Syntax fixes validated
- Task 46: Cleanup validated
- Task 65: SASL/PLAIN works
- Task 74: OAuth2 works
- Task 83: WebSocket works
- Task 95: Final validation

---

## Notes

1. Each task is **≤15 minutes** as requested
2. Tasks are sorted by **ROI (Impact/Effort)**
3. Dependencies are clearly marked
4. Parallel execution opportunities identified
5. Checkpoints ensure we don't proceed with broken code
6. Total: **97 tasks, ~25 hours**

---

_This micro-task breakdown ensures steady progress with frequent validation points_
