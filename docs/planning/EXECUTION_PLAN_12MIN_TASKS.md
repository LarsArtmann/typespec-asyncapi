# 🎯 COMPREHENSIVE 12-MINUTE TASK EXECUTION PLAN
## TypeSpec AsyncAPI Emitter - Decorator Resolution & Property Enumeration Fixes
**Created:** 2025-10-30 22:20 CET
**Target:** Fix all critical blockers, achieve 750/755 tests passing

---

## 📊 TASK BREAKDOWN - ALL TASKS ≤12 MINUTES

| # | Task | Time | Impact | Effort | Score | Phase | Status |
|---|------|------|--------|--------|-------|-------|--------|
| 1 | Research TypeSpec decorator resolution docs | 12m | CRITICAL | 12m | 10.0 | Research | ⏸️ TODO |
| 2 | Find working TypeSpec libraries with decorators | 12m | CRITICAL | 12m | 10.0 | Research | ⏸️ TODO |
| 3 | Check our package.json vs TypeSpec template | 8m | HIGH | 8m | 7.5 | Research | ⏸️ TODO |
| 4 | Read TypeSpec compiler decorator loader code | 12m | CRITICAL | 12m | 10.0 | Research | ⏸️ TODO |
| 5 | Document research findings | 8m | HIGH | 8m | 7.5 | Research | ⏸️ TODO |
| 6 | **HYPOTHESIS A: Remove lib.ts decorator export** | 8m | CRITICAL | 8m | 10.0 | Test | ⏸️ TODO |
| 7 | Build and test Hypothesis A | 8m | CRITICAL | 8m | 10.0 | Test | ⏸️ TODO |
| 8 | **HYPOTHESIS B: Remove index.ts decorator export** | 8m | CRITICAL | 8m | 10.0 | Test | ⏸️ TODO |
| 9 | Build and test Hypothesis B | 8m | CRITICAL | 8m | 10.0 | Test | ⏸️ TODO |
| 10 | Check package.json exports field config | 8m | HIGH | 8m | 7.5 | Test | ⏸️ TODO |
| 11 | Create minimal decorator test library | 12m | CRITICAL | 12m | 10.0 | Test | ⏸️ TODO |
| 12 | Test minimal library in isolation | 8m | CRITICAL | 8m | 10.0 | Test | ⏸️ TODO |
| 13 | Identify correct decorator export pattern | 8m | CRITICAL | 8m | 10.0 | Analyze | ⏸️ TODO |
| 14 | Implement correct export structure | 10m | CRITICAL | 10m | 10.0 | Fix | ⏸️ TODO |
| 15 | Rebuild project | 2m | CRITICAL | 2m | 10.0 | Fix | ⏸️ TODO |
| 16 | Verify dist/ has correct structure | 4m | HIGH | 4m | 7.5 | Fix | ⏸️ TODO |
| 17 | Test single decorator (@channel) | 6m | CRITICAL | 6m | 10.0 | Verify | ⏸️ TODO |
| 18 | Test all 11 decorators | 10m | CRITICAL | 10m | 10.0 | Verify | ⏸️ TODO |
| 19 | Verify "missing implementation" errors gone | 6m | CRITICAL | 6m | 10.0 | Verify | ⏸️ TODO |
| 20 | Commit decorator fix | 4m | HIGH | 4m | 7.5 | Verify | ⏸️ TODO |
| 21 | **Fix channel ambiguity in lib/main.tsp** | 6m | HIGH | 6m | 8.3 | Fix | ⏸️ TODO |
| 22 | Test channel decorator usage | 6m | HIGH | 6m | 8.3 | Verify | ⏸️ TODO |
| 23 | Commit channel ambiguity fix | 4m | MEDIUM | 4m | 5.0 | Verify | ⏸️ TODO |
| 24 | Add debug logging to property enumeration | 12m | CRITICAL | 12m | 10.0 | Debug | ⏸️ TODO |
| 25 | Test property enumeration with simple model | 6m | CRITICAL | 6m | 10.0 | Debug | ⏸️ TODO |
| 26 | Check TypeSpec model lifecycle documentation | 10m | CRITICAL | 10m | 10.0 | Research | ⏸️ TODO |
| 27 | Identify why walkPropertiesInherited is empty | 12m | CRITICAL | 12m | 10.0 | Debug | ⏸️ TODO |
| 28 | Implement property enumeration fix | 12m | CRITICAL | 12m | 10.0 | Fix | ⏸️ TODO |
| 29 | Test property enumeration returns properties | 8m | CRITICAL | 8m | 10.0 | Verify | ⏸️ TODO |
| 30 | Commit property enumeration fix | 4m | HIGH | 4m | 7.5 | Verify | ⏸️ TODO |
| 31 | Fix schema-conversion.ts line 218 split-brain | 6m | MEDIUM | 6m | 5.0 | Fix | ⏸️ TODO |
| 32 | Fix schema-conversion.ts line 304 split-brain | 6m | MEDIUM | 6m | 5.0 | Fix | ⏸️ TODO |
| 33 | Test schema conversion consistency | 6m | MEDIUM | 6m | 5.0 | Verify | ⏸️ TODO |
| 34 | Commit split-brain fixes | 4m | MEDIUM | 4m | 5.0 | Verify | ⏸️ TODO |
| 35 | Run full test suite | 12m | CRITICAL | 12m | 10.0 | Verify | ⏸️ TODO |
| 36 | Analyze test results | 8m | HIGH | 8m | 7.5 | Verify | ⏸️ TODO |
| 37 | Document success metrics | 6m | HIGH | 6m | 7.5 | Document | ⏸️ TODO |
| 38 | Update GitHub issues with results | 8m | HIGH | 8m | 7.5 | Document | ⏸️ TODO |
| 39 | Final commit and push | 4m | HIGH | 4m | 7.5 | Complete | ⏸️ TODO |
| 40 | Create session summary | 8m | MEDIUM | 8m | 5.0 | Complete | ⏸️ TODO |

**Total Tasks:** 40
**Total Time:** ~5 hours
**Expected Impact:** +750 tests passing (400 decorator + 300 property + 50 ambiguity)

---

## 🎯 EXECUTION PRIORITY (Sorted by Score & Dependencies)

### 🔴 CRITICAL PATH - PHASE 1: DECORATOR RESOLUTION (Tasks 1-20)
**Time:** ~2.5 hours | **Impact:** +400 tests

1. Research TypeSpec decorator resolution (12m)
2. Find working examples (12m)
3. Check package.json (8m)
4. Read compiler code (12m)
5. Document findings (8m)
6. **HYPOTHESIS A** - Remove lib.ts export (8m)
7. Test Hypothesis A (8m)
8. **HYPOTHESIS B** - Remove index.ts export (8m)
9. Test Hypothesis B (8m)
10. Check exports config (8m)
11. Create minimal test library (12m)
12. Test minimal library (8m)
13. Identify correct pattern (8m)
14. Implement fix (10m)
15. Rebuild (2m)
16. Verify dist/ (4m)
17. Test single decorator (6m)
18. Test all decorators (10m)
19. Verify errors gone (6m)
20. Commit (4m)

### 🟡 HIGH PRIORITY - PHASE 2: CHANNEL AMBIGUITY (Tasks 21-23)
**Time:** ~16 minutes | **Impact:** +50-100 tests

21. Fix lib/main.tsp (6m)
22. Test channel usage (6m)
23. Commit (4m)

### 🟡 HIGH PRIORITY - PHASE 3: PROPERTY ENUMERATION (Tasks 24-30)
**Time:** ~1.3 hours | **Impact:** +300 tests

24. Add debug logging (12m)
25. Test with simple model (6m)
26. Research model lifecycle (10m)
27. Identify root cause (12m)
28. Implement fix (12m)
29. Test fix works (8m)
30. Commit (4m)

### 🟢 MEDIUM PRIORITY - PHASE 4: CODE QUALITY (Tasks 31-34)
**Time:** ~22 minutes | **Impact:** Code consistency

31. Fix line 218 (6m)
32. Fix line 304 (6m)
33. Test consistency (6m)
34. Commit (4m)

### ✅ VERIFICATION - PHASE 5: COMPLETE (Tasks 35-40)
**Time:** ~46 minutes | **Impact:** Documentation & validation

35. Run full test suite (12m)
36. Analyze results (8m)
37. Document success (6m)
38. Update GitHub issues (8m)
39. Final commit/push (4m)
40. Session summary (8m)

---

## 📋 DETAILED TASK DESCRIPTIONS

### Task 1: Research TypeSpec Decorator Resolution Docs
**Time:** 12 minutes
**Actions:**
1. Search TypeSpec.io for "decorator resolution"
2. Check "Extending TypeSpec" documentation
3. Look for "extern dec" implementation guide
4. Document key findings in notes

### Task 2: Find Working TypeSpec Libraries with Decorators
**Time:** 12 minutes
**Actions:**
1. Check @typespec/rest package structure
2. Check @typespec/openapi3 package structure
3. Examine how they export decorators
4. Compare to our structure

### Task 3: Check Package.json vs Template
**Time:** 8 minutes
**Actions:**
1. Compare our package.json exports field
2. Compare TypeSpec template package.json
3. Check for missing/extra fields
4. Note differences

### Task 4: Read TypeSpec Compiler Decorator Loader Code
**Time:** 12 minutes
**Actions:**
1. Find decorator resolution in node_modules/@typespec/compiler/src
2. Read how it maps extern dec → $decorator
3. Understand file resolution logic
4. Document findings

### Task 5: Document Research Findings
**Time:** 8 minutes
**Actions:**
1. Create findings.md
2. Summarize decorator resolution mechanism
3. Note correct pattern
4. List action items

### Task 6: HYPOTHESIS A - Remove lib.ts Decorator Export
**Time:** 8 minutes
**Actions:**
1. Edit src/lib.ts
2. Remove `export * from "./decorators.js"`
3. Keep only library definition
4. Save changes

### Task 7: Build and Test Hypothesis A
**Time:** 8 minutes
**Actions:**
1. Run `bun run build`
2. Run test: `bun test test/unit/emitter-core.test.ts`
3. Check for "missing implementation" errors
4. Document result (worked/failed)

### Task 8: HYPOTHESIS B - Remove index.ts Decorator Export
**Time:** 8 minutes
**Actions:**
1. Edit src/index.ts
2. Remove or comment `export * from "./decorators.js"`
3. Keep $onEmit and other exports
4. Save changes

### Task 9: Build and Test Hypothesis B
**Time:** 8 minutes
**Actions:**
1. Run `bun run build`
2. Run test again
3. Check errors
4. Document result

### Task 10: Check Package.json Exports Field Config
**Time:** 8 minutes
**Actions:**
1. Review current exports field
2. Check if decorators need explicit path
3. Try adding "./decorators": "./dist/decorators.js"
4. Test if it helps

### Task 11: Create Minimal Decorator Test Library
**Time:** 12 minutes
**Actions:**
1. Create `tmp/test-decorator/` directory
2. Create minimal package.json
3. Create lib/main.tsp with one extern dec
4. Create src/decorators.ts with one $decorator
5. Create src/lib.ts with library definition

### Task 12: Test Minimal Library in Isolation
**Time:** 8 minutes
**Actions:**
1. Build minimal library
2. Create test TypeSpec file using decorator
3. Compile with tsp compile
4. Check if decorator resolves
5. Document result

### Task 13: Identify Correct Decorator Export Pattern
**Time:** 8 minutes
**Actions:**
1. Review all test results
2. Determine which pattern worked
3. Document the winning approach
4. Plan implementation

### Task 14: Implement Correct Export Structure
**Time:** 10 minutes
**Actions:**
1. Apply winning pattern to our codebase
2. Update src/index.ts if needed
3. Update src/lib.ts if needed
4. Update src/decorators.ts if needed
5. Save all changes

### Task 15: Rebuild Project
**Time:** 2 minutes
**Actions:**
1. Run `bun run build`
2. Verify 0 errors

### Task 16: Verify dist/ Has Correct Structure
**Time:** 4 minutes
**Actions:**
1. Check dist/decorators.js exports
2. Check dist/index.js exports
3. Check dist/lib.js exports
4. Verify match expected pattern

### Task 17: Test Single Decorator (@channel)
**Time:** 6 minutes
**Actions:**
1. Run small test using @channel
2. Check for "missing implementation"
3. Verify it works

### Task 18: Test All 11 Decorators
**Time:** 10 minutes
**Actions:**
1. Run test covering all decorators
2. Verify all resolve correctly
3. Check for any remaining errors

### Task 19: Verify "Missing Implementation" Errors Gone
**Time:** 6 minutes
**Actions:**
1. Run `bun test test/integration/basic-functionality.test.ts`
2. Grep for "missing implementation"
3. Confirm 0 matches

### Task 20: Commit Decorator Fix
**Time:** 4 minutes
**Actions:**
1. `git add -A`
2. `git commit -m "fix: Resolve TypeSpec decorator implementation errors..."`
3. Detailed commit message

### Task 21: Fix Channel Ambiguity in lib/main.tsp
**Time:** 6 minutes
**Actions:**
1. Edit lib/main.tsp
2. Change `extern dec channel` namespace or name
3. OR ensure no global conflict
4. Save

### Task 22: Test Channel Decorator Usage
**Time:** 6 minutes
**Actions:**
1. Run test using @channel
2. Verify no ambiguity error
3. Confirm works

### Task 23: Commit Channel Ambiguity Fix
**Time:** 4 minutes
**Actions:**
1. `git add lib/main.tsp`
2. `git commit -m "fix: Resolve channel decorator ambiguity"`

### Task 24: Add Debug Logging to Property Enumeration
**Time:** 12 minutes
**Actions:**
1. Edit src/utils/schema-conversion.ts
2. Add logging before/during/after walkPropertiesInherited
3. Log model.kind, model.name, model.properties.size
4. Log each property found
5. Rebuild

### Task 25: Test Property Enumeration with Simple Model
**Time:** 6 minutes
**Actions:**
1. Run test with basic model
2. Check logs for debug output
3. See if properties are enumerated
4. Document findings

### Task 26: Check TypeSpec Model Lifecycle Documentation
**Time:** 10 minutes
**Actions:**
1. Search for TypeSpec compilation phases
2. Understand when properties are populated
3. Check if models need "finalization"
4. Document findings

### Task 27: Identify Why walkPropertiesInherited is Empty
**Time:** 12 minutes
**Actions:**
1. Review debug logs
2. Check if models are templates vs instances
3. Check if we're accessing too early in lifecycle
4. Identify root cause

### Task 28: Implement Property Enumeration Fix
**Time:** 12 minutes
**Actions:**
1. Apply fix based on root cause
2. Update schema-conversion.ts
3. Handle model lifecycle correctly
4. Rebuild

### Task 29: Test Property Enumeration Returns Properties
**Time:** 8 minutes
**Actions:**
1. Run test with models
2. Verify logs show properties found
3. Verify schemas have properties
4. Confirm fix works

### Task 30: Commit Property Enumeration Fix
**Time:** 4 minutes
**Actions:**
1. `git add src/utils/schema-conversion.ts`
2. `git commit -m "fix: Property enumeration returns actual properties"`

### Task 31: Fix schema-conversion.ts Line 218 Split-Brain
**Time:** 6 minutes
**Actions:**
1. Edit src/utils/schema-conversion.ts line 218
2. Replace `modelType.properties.entries()` with `walkPropertiesInherited(modelType)`
3. Save

### Task 32: Fix schema-conversion.ts Line 304 Split-Brain
**Time:** 6 minutes
**Actions:**
1. Edit src/utils/schema-conversion.ts line 304
2. Replace `model.properties.forEach` with `walkPropertiesInherited(model)`
3. Save

### Task 33: Test Schema Conversion Consistency
**Time:** 6 minutes
**Actions:**
1. Rebuild
2. Run schema tests
3. Verify consistent behavior
4. Check inheritance works

### Task 34: Commit Split-Brain Fixes
**Time:** 4 minutes
**Actions:**
1. `git add src/utils/schema-conversion.ts`
2. `git commit -m "refactor: Use walkPropertiesInherited consistently"`

### Task 35: Run Full Test Suite
**Time:** 12 minutes
**Actions:**
1. `bun test 2>&1 | tee test-results-final.log`
2. Wait for completion
3. Save results

### Task 36: Analyze Test Results
**Time:** 8 minutes
**Actions:**
1. Count passing tests
2. Count failing tests
3. Identify remaining failures
4. Calculate improvement

### Task 37: Document Success Metrics
**Time:** 6 minutes
**Actions:**
1. Create summary.md
2. Before/after test counts
3. Issues resolved
4. Remaining issues

### Task 38: Update GitHub Issues with Results
**Time:** 8 minutes
**Actions:**
1. Comment on Issue #179 (decorators)
2. Comment on Issue #180 (properties)
3. Create new issues for remaining failures

### Task 39: Final Commit and Push
**Time:** 4 minutes
**Actions:**
1. `git add -A`
2. `git commit -m "Session complete: Decorator + property fixes"`
3. `git push origin master`

### Task 40: Create Session Summary
**Time:** 8 minutes
**Actions:**
1. Document what was fixed
2. Document what remains
3. Note learnings
4. Save summary

---

## ✅ SUCCESS CRITERIA

After completing all 40 tasks:
- ✅ Zero "missing implementation" errors
- ✅ Zero "ambiguous channel" errors
- ✅ Property enumeration returns actual properties (not 0)
- ✅ 750+ tests passing (from ~450)
- ✅ All fixes committed with clear messages
- ✅ Pushed to origin/master
- ✅ Documentation complete

---

## 🎯 READY TO EXECUTE

**Total Tasks:** 40
**Total Time:** ~5 hours
**Current Time:** 22:20 CET
**Estimated Completion:** 03:20 CET (if done straight through)

**Strategy:**
1. Execute tasks sequentially
2. Commit after each phase
3. Verify before moving to next phase
4. Document all findings
5. DO NOT STOP until all 40 tasks complete

**Let's GO! 🚀**
