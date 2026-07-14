# Comprehensive Execution Plan - Test Suite Recovery & Architecture Cleanup

**Date:** 2025-10-05T00:37:09Z
**Current Status:** 407/580 passing (70% pass rate)
**Goal:** 80%+ pass rate + Architecture cleanup + Zero ghost systems

---

## PHASE 1: QUICK WINS (30-100 min tasks) - HIGH IMPACT, LOW EFFORT

| #                 | Task                                          | Time      | Impact | Effort | Customer Value    | Priority | Lines Changed  |
| ----------------- | --------------------------------------------- | --------- | ------ | ------ | ----------------- | -------- | -------------- |
| 1                 | Fix plugin-system.test.ts auto-registration   | 30min     | HIGH   | LOW    | Tests pass        | P0       | ~20 lines      |
| 2                 | Fix options.test.ts schema structure          | 45min     | HIGH   | LOW    | Tests pass        | P0       | ~30 lines      |
| 3                 | Fix emitter-core.test.ts file paths (5 tests) | 60min     | HIGH   | MEDIUM | Tests pass        | P0       | ~50 lines      |
| 4                 | Replace validateAsyncAPIStructure with Parser | 45min     | HIGH   | LOW    | Better validation | P1       | -50, +10       |
| 5                 | Simplify AsyncAPIAssertions.hasValidStructure | 30min     | MEDIUM | LOW    | Less code         | P1       | -40, +10       |
| 6                 | Extract hardcoded paths to constants          | 45min     | MEDIUM | LOW    | Maintainability   | P1       | ~100 lines     |
| 7                 | Add 5 domain tests - Channel behavior         | 90min     | HIGH   | MEDIUM | Business value    | P1       | +200 lines     |
| 8                 | Add 5 domain tests - Message transformation   | 90min     | HIGH   | MEDIUM | Business value    | P1       | +200 lines     |
| 9                 | Add 5 domain tests - Server config            | 90min     | HIGH   | MEDIUM | Business value    | P1       | +200 lines     |
| 10                | Add 5 domain tests - Security schemes         | 90min     | HIGH   | MEDIUM | Business value    | P1       | +200 lines     |
| 11                | Add 5 domain tests - Multi-tenant routing     | 90min     | HIGH   | MEDIUM | Business value    | P1       | +200 lines     |
| 12                | Delete Alpha fallback logic (Lines 222-317)   | 60min     | HIGH   | MEDIUM | Remove ghost      | P2       | -100 lines     |
| **TOTAL PHASE 1** | **12 tasks**                                  | **12.5h** |        |        | **+30-40 tests**  |          | **+800, -190** |

**Phase 1 Expected Results:**

- Test pass rate: 70% → 77% (407 → 450/580)
- Ghost systems removed: 1 (Alpha fallback)
- Better domain coverage: +25 tests
- Technical debt: -290 lines

---

## PHASE 2: CRITICAL PATH (30-100 min tasks) - HIGH IMPACT, MEDIUM EFFORT

| #                 | Task                                               | Time      | Impact   | Effort | Customer Value    | Priority | Lines Changed  |
| ----------------- | -------------------------------------------------- | --------- | -------- | ------ | ----------------- | -------- | -------------- |
| 13                | Research ValidationService binding pattern         | 30min     | CRITICAL | LOW    | Understanding     | P0       | 0              |
| 14                | Apply DocumentBuilder pattern to ValidationService | 90min     | CRITICAL | HIGH   | Tests pass        | P0       | ~80 lines      |
| 15                | Fix validateDocumentContent() binding (4 tests)    | 60min     | HIGH     | MEDIUM | Tests pass        | P0       | ~30 lines      |
| 16                | Add ValidationService unit tests                   | 90min     | HIGH     | MEDIUM | Coverage          | P1       | +150 lines     |
| 17                | Replace manual diagnostics with Parser.validate()  | 60min     | MEDIUM   | MEDIUM | Better validation | P1       | -40, +15       |
| 18                | Migrate to createTester() API (modern TypeSpec)    | 90min     | MEDIUM   | MEDIUM | Future-proof      | P2       | ~100 lines     |
| 19                | Add expectDiagnostics() usage                      | 45min     | MEDIUM   | LOW    | Better assertions | P2       | ~50 lines      |
| 20                | Extract TestSources to fixture files               | 90min     | MEDIUM   | MEDIUM | Less code         | P2       | -100, +files   |
| 21                | Consolidate TestLogging patterns                   | 45min     | LOW      | LOW    | Cleanup           | P2       | -30, +10       |
| 22                | Add conformance tests (AsyncAPI examples)          | 90min     | HIGH     | MEDIUM | Spec compliance   | P1       | +250 lines     |
| 23                | Create architecture diagram (current state)        | 60min     | MEDIUM   | MEDIUM | Documentation     | P2       | +1 file        |
| 24                | Create architecture diagram (desired state)        | 60min     | MEDIUM   | MEDIUM | Documentation     | P2       | +1 file        |
| **TOTAL PHASE 2** | **12 tasks**                                       | **13.3h** |          |        | **+20 tests**     |          | **+465, -170** |

**Phase 2 Expected Results:**

- Test pass rate: 77% → 85% (450 → 495/580)
- ValidationService binding: FIXED
- Architecture documented
- Modern TypeSpec patterns adopted

---

## PHASE 3: CONSOLIDATION (30-100 min tasks) - MEDIUM IMPACT, VARIABLE EFFORT

| #                 | Task                                        | Time      | Impact | Effort | Customer Value     | Priority | Lines Changed  |
| ----------------- | ------------------------------------------- | --------- | ------ | ------ | ------------------ | -------- | -------------- |
| 25                | Fix remaining emitter-core tests (10 tests) | 90min     | MEDIUM | HIGH   | Tests pass         | P1       | ~80 lines      |
| 26                | Fix validation framework tests (15 tests)   | 90min     | MEDIUM | HIGH   | Tests pass         | P1       | ~100 lines     |
| 27                | Add property-based tests (fast-check)       | 90min     | HIGH   | MEDIUM | Better coverage    | P1       | +200 lines     |
| 28                | Create test data factories                  | 60min     | MEDIUM | MEDIUM | Less duplication   | P2       | +100, -50      |
| 29                | Extract constants to centralized config     | 60min     | MEDIUM | MEDIUM | Maintainability    | P2       | +50, -80       |
| 30                | Remove deprecated validateAsyncAPIStructure | 30min     | LOW    | LOW    | Cleanup            | P2       | -50 lines      |
| 31                | Document learnings                          | 45min     | MEDIUM | LOW    | Future reference   | P2       | +1 file        |
| 32                | Create reusable prompts                     | 45min     | MEDIUM | LOW    | Future sessions    | P2       | +1 file        |
| 33                | Update README with test instructions        | 30min     | LOW    | LOW    | Documentation      | P3       | ~30 lines      |
| 34                | Add CI test validation                      | 60min     | HIGH   | MEDIUM | Prevent regression | P1       | +1 file        |
| 35                | Create test coverage report                 | 45min     | MEDIUM | LOW    | Metrics            | P2       | +1 file        |
| 36                | Final cleanup and verification              | 60min     | HIGH   | LOW    | Quality gate       | P0       | 0              |
| **TOTAL PHASE 3** | **12 tasks**                                | **12.8h** |        |        | **+25 tests**      |          | **+382, -180** |

**Phase 3 Expected Results:**

- Test pass rate: 85% → 90%+ (495 → 540+/580)
- All ghost systems removed
- Full documentation complete
- CI pipeline enhanced

---

## SUMMARY BY PRIORITY

| Priority          | Tasks        | Time      | Expected Outcome                              |
| ----------------- | ------------ | --------- | --------------------------------------------- |
| **P0 (CRITICAL)** | 6 tasks      | 6.0h      | ValidationService fixed, quick wins completed |
| **P1 (HIGH)**     | 19 tasks     | 22.8h     | 80%+ pass rate, domain tests added            |
| **P2 (MEDIUM)**   | 10 tasks     | 9.3h      | Architecture documented, cleanup complete     |
| **P3 (LOW)**      | 1 task       | 0.5h      | Documentation polished                        |
| **TOTAL**         | **36 tasks** | **38.6h** | **90%+ pass rate, zero ghost systems**        |

---

## CUSTOMER VALUE ANALYSIS

### Direct Customer Value (Immediate Business Impact)

1. **25+ Domain/Behavior Tests** (Tasks 7-11, 22, 27) - Validate actual AsyncAPI generation business logic
2. **ValidationService Fixed** (Tasks 14-15) - Critical validation framework operational
3. **90%+ Pass Rate** (All tasks) - Production-ready quality gate

**Total Customer Value: ~30 tests directly validating business requirements**

### Indirect Customer Value (Quality & Maintainability)

1. **Ghost Systems Removed** (Task 12) - Faster development, fewer bugs
2. **Modern TypeSpec Patterns** (Tasks 18-19) - Future-proof codebase
3. **Architecture Documentation** (Tasks 23-24, 31-32) - Team knowledge sharing
4. **CI Validation** (Task 34) - Prevent regressions

**Total Maintainability Value: -540 lines deleted, better patterns adopted**

---

## EXECUTION STRATEGY

### Week 1 (Days 1-2): QUICK WINS + CRITICAL PATH

- **Day 1 AM:** Tasks 1-6 (Quick wins, 4.5h)
- **Day 1 PM:** Tasks 13-15 (ValidationService fix, 3h)
- **Day 2 AM:** Tasks 7-9 (Domain tests, 4.5h)
- **Day 2 PM:** Tasks 10-11 (Domain tests, 3h)

**Checkpoint:** 450/580 passing (77% → target for Day 2 end)

### Week 1 (Days 3-4): DOMAIN TESTS + VALIDATION

- **Day 3 AM:** Tasks 16-17 (Validation improvements, 2.5h)
- **Day 3 PM:** Tasks 22, 27 (Conformance & property tests, 3h)
- **Day 4 AM:** Tasks 25-26 (Fix remaining tests, 3h)
- **Day 4 PM:** Tasks 18-19 (Modern TypeSpec patterns, 2.3h)

**Checkpoint:** 520/580 passing (90% → target for Day 4 end)

### Week 1 (Day 5): CLEANUP + DOCUMENTATION

- **Day 5 AM:** Tasks 12, 20, 21, 28-30 (Cleanup, 5.8h)
- **Day 5 PM:** Tasks 23-24, 31-35 (Documentation, 6.5h)
- **Day 5 End:** Task 36 (Final verification, 1h)

**Final Status:** 540+/605 passing (90%+), zero ghost systems, full documentation

---

## GIT COMMIT STRATEGY

### After Each Task (36 commits total)

```bash
git add <changed-files>
git commit -m "<type>(test): <task-description>

Task #<N>: <full-task-name>

Changes:
- <what-changed>
- <what-changed>

Impact:
- Tests: <before> → <after> passing
- Lines: <added>/<deleted>

Contributes to: <customer-value>

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin feature/effect-ts-complete-migration
```

### Types of Commits

- `fix(test):` - Fixing failing tests (Tasks 1-6, 13-17, 25-26)
- `feat(test):` - Adding new domain tests (Tasks 7-11, 22, 27)
- `refactor(test):` - Cleanup and improvements (Tasks 12, 18-21, 28-30)
- `docs:` - Documentation (Tasks 23-24, 31-35)
- `chore:` - Final verification (Task 36)

---

## SUCCESS CRITERIA

### Quantitative

- ✅ Test pass rate: **90%+** (540/605)
- ✅ Domain tests added: **25+**
- ✅ Ghost systems removed: **2+**
- ✅ Code deleted: **500+ lines**
- ✅ Documentation files: **5+**

### Qualitative

- ✅ All ValidationService binding issues resolved
- ✅ Zero "Alpha fallback" fake data in tests
- ✅ Modern TypeSpec testing patterns adopted
- ✅ Architecture clearly documented
- ✅ Future sessions have reusable prompts

### Non-Goals (Scope Control)

- ❌ Implement new AsyncAPI features
- ❌ Refactor entire emitter architecture
- ❌ Achieve 100% test coverage
- ❌ Fix ALL 580 tests (some may be obsolete)

---

## RISK MITIGATION

| Risk                            | Mitigation                                          | Contingency                            |
| ------------------------------- | --------------------------------------------------- | -------------------------------------- |
| ValidationService fix > 2h      | Research DocumentBuilder pattern first              | Skip to Phase 1 tasks, revisit later   |
| Domain tests take > 8h          | Use test-helpers utilities, reduce to 20 tests      | Still meets 80%+ pass rate goal        |
| Breaking changes in refactoring | Commit after each task, run tests before push       | Revert last commit, try smaller change |
| Scope creep during execution    | Stick to 36 tasks, defer new ideas to GitHub issues | Create issue, continue with plan       |

---

## NOTES

1. **Time estimates include:** Research, implementation, testing, commit
2. **Lines changed are estimates** based on similar past work
3. **Customer value focuses on** business logic validation, not infrastructure tests
4. **Priority P0** must complete before P1, but P1/P2 can interleave
5. **Git commits** are MANDATORY after each task - no batching

**Created by:** Claude (Sonnet 4.5)
**For session:** 2025-10-05 Test Suite Recovery
