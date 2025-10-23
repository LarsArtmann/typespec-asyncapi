# Task Breakdown: 30-100 Minute Tasks
**Total Tasks:** 30
**Total Estimated Time:** 25 hours
**Sorted By:** Impact → Effort ratio (highest ROI first)

---

## Task Table (Sorted by Priority)

| # | Task | Category | Est. Time | Impact | Effort | ROI | Status |
|---|------|----------|-----------|--------|--------|-----|--------|
| 1 | Fix compileAndGetAsyncAPI() helper file matching | CRITICAL | 30min | 🔥🔥🔥🔥🔥 | Low | 5.0 | ⏳ Pending |
| 2 | Verify helper fix impact with test run | CRITICAL | 15min | 🔥🔥🔥🔥🔥 | Low | 5.0 | ⏳ Pending |
| 3 | Fix debug-emitter.test.ts Effect.log import | QUICK WIN | 10min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 4 | Fix direct-emitter.test.ts Effect.log import | QUICK WIN | 10min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 5 | Fix real-emitter.test.ts Effect.log import | QUICK WIN | 10min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 6 | Run test suite after quick wins | VALIDATION | 15min | 🔥🔥🔥🔥 | Low | 4.0 | ⏳ Pending |
| 7 | Analyze TypeSpec compilation errors (26 errors) | ANALYSIS | 45min | 🔥🔥🔥🔥 | Med | 2.7 | ⏳ Pending |
| 8 | Fix TypeSpec syntax errors batch 1 (10 tests) | SYNTAX | 60min | 🔥🔥🔥 | Med | 2.0 | ⏳ Pending |
| 9 | Fix TypeSpec syntax errors batch 2 (10 tests) | SYNTAX | 60min | 🔥🔥🔥 | Med | 2.0 | ⏳ Pending |
| 10 | Fix remaining TypeSpec errors (6 tests) | SYNTAX | 40min | 🔥🔥 | Med | 1.3 | ⏳ Pending |
| 11 | Create docs/emitter-feature-matrix.md | DOCS | 45min | 🔥🔥🔥🔥 | Low | 4.0 | ⏳ Pending |
| 12 | Mark unsupported security tests as .skip() | CLEANUP | 60min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 13 | Mark unsupported Kafka tests as .skip() | CLEANUP | 30min | 🔥🔥 | Low | 2.0 | ⏳ Pending |
| 14 | Mark unsupported WebSocket/MQTT tests as .skip() | CLEANUP | 30min | 🔥🔥 | Low | 2.0 | ⏳ Pending |
| 15 | Run test suite after cleanup | VALIDATION | 15min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 16 | Categorize all 347 failing tests by root cause | ANALYSIS | 90min | 🔥🔥🔥🔥 | High | 1.3 | ⏳ Pending |
| 17 | Create docs/known-test-failures.md | DOCS | 60min | 🔥🔥🔥 | Med | 2.0 | ⏳ Pending |
| 18 | Implement SASL/PLAIN authentication for Kafka | FEATURE | 120min | 🔥🔥🔥🔥 | High | 1.3 | ⏳ Pending |
| 19 | Add tests for SASL/PLAIN implementation | FEATURE | 45min | 🔥🔥🔥 | Med | 2.0 | ⏳ Pending |
| 20 | Implement OAuth2 client credentials flow | FEATURE | 100min | 🔥🔥🔥 | High | 1.0 | ⏳ Pending |
| 21 | Add tests for OAuth2 implementation | FEATURE | 45min | 🔥🔥 | Med | 1.3 | ⏳ Pending |
| 22 | Implement basic WebSocket bindings | FEATURE | 90min | 🔥🔥🔥 | High | 1.1 | ⏳ Pending |
| 23 | Add tests for WebSocket implementation | FEATURE | 45min | 🔥🔥 | Med | 1.3 | ⏳ Pending |
| 24 | Create validateSecurityScheme() test helper | UTILITY | 45min | 🔥🔥 | Med | 1.3 | ⏳ Pending |
| 25 | Create expectAsyncAPIValid() assertion helper | UTILITY | 30min | 🔥🔥 | Low | 2.0 | ⏳ Pending |
| 26 | Improve AsyncAPI file detection in helper | IMPROVEMENT | 45min | 🔥🔥 | Med | 1.3 | ⏳ Pending |
| 27 | Update CLAUDE.md with honest feature matrix | DOCS | 30min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |
| 28 | Update README.md with test coverage | DOCS | 20min | 🔥🔥 | Low | 2.0 | ⏳ Pending |
| 29 | Run full validation suite | VALIDATION | 20min | 🔥🔥🔥🔥 | Low | 4.0 | ⏳ Pending |
| 30 | Create final status report | DOCS | 30min | 🔥🔥🔥 | Low | 3.0 | ⏳ Pending |

---

## Phase Breakdown

### PHASE 1: THE 1% (Critical Path) - 45 minutes
**Tasks:** 1-2
**Goal:** Fix the root cause blocking 50+ tests
**Expected Impact:** 439 → ~480 passing tests

### PHASE 2: THE 4% (Quick Wins) - 3 hours 45 minutes
**Tasks:** 3-15
**Goal:** Fix easy wins and document unsupported features
**Expected Impact:** 480 → ~500 passing tests

### PHASE 3: THE 20% (Strategic) - 12 hours 30 minutes
**Tasks:** 16-26
**Goal:** Implement core features and improve infrastructure
**Expected Impact:** 500 → ~530 passing tests

### PHASE 4: Polish & Documentation - 2 hours 10 minutes
**Tasks:** 27-30
**Goal:** Update docs and create final report
**Expected Impact:** Clear documentation, honest metrics

---

## Total Estimated Time: ~19 hours 10 minutes

---

## Priority Levels Explained

🔥🔥🔥🔥🔥 = **CRITICAL** - Blocks everything else
🔥🔥🔥🔥 = **HIGH** - Major impact, must do
🔥🔥🔥 = **MEDIUM** - Significant value
🔥🔥 = **LOW** - Nice to have
🔥 = **MINIMAL** - Optional

---

## ROI Calculation

ROI = Impact / Effort
- 5.0 = Highest priority (critical path)
- 4.0 = Very high priority (quick wins)
- 3.0 = High priority (good value)
- 2.0 = Medium priority (balanced)
- 1.0 = Low priority (expensive)

---

## Dependencies

```
Task 1 → Task 2 (must verify fix works)
Task 2 → Task 3-5 (need working helper first)
Tasks 3-5 → Task 6 (validate quick wins)
Task 7 → Tasks 8-10 (need analysis before fixes)
Tasks 8-10 → Task 11 (understand gaps before documenting)
Task 11 → Tasks 12-14 (need feature matrix to mark skips)
Tasks 12-14 → Task 15 (validate cleanup)
Task 15 → Task 16 (need clean results to categorize)
Task 16 → Task 17 (analysis feeds documentation)
Tasks 18-23 → Task 29 (features must work before validation)
Tasks 24-26 → Task 29 (utilities ready for validation)
Task 29 → Task 30 (final run before report)
```

---

*This breakdown follows the constraint: 30-100 minutes per task, sorted by ROI*
