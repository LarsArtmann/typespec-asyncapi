# 🎯 FOCUSED Execution Plan - Test Pass Rate 73% → 90%+

**Date**: 2025-10-05 02:00 UTC
**Current**: 408/556 passing (73.4%)
**Target**: 500+/556 passing (90%+)
**Gap**: Need +92 passing tests

**BRUTAL TRUTH**: Previous 179-task plan was BLOATED with scope creep.
**NEW STRATEGY**: Focus ONLY on increasing test pass rate. Delete everything else.

---

## 📊 30-100 Minute Tasks (Sorted by Impact)

| #      | Task                                         | Impact               | Effort | Customer Value | Time   |
| ------ | -------------------------------------------- | -------------------- | ------ | -------------- | ------ |
| **1**  | Fix ValidationService Effect.TS binding      | +20 tests            | Medium | CRITICAL       | 90min  |
| **2**  | Fix emitter file path expectations (4 tests) | +4 tests             | Low    | High           | 30min  |
| **3**  | Fix @server decorator compilation            | +10 tests            | Medium | High           | 60min  |
| **4**  | Fix @subscribe decorator tests               | +4 tests             | Low    | High           | 40min  |
| **5**  | Fix protocol binding integration tests       | +8 tests             | Medium | High           | 60min  |
| **6**  | Delete Alpha emitter (remove split brain)    | +0 tests, clean code | High   | Medium         | 100min |
| **7**  | Fix command name detection                   | +1 test              | Low    | Low            | 30min  |
| **8**  | Fix mock elimination tests                   | +3 tests             | Low    | Medium         | 40min  |
| **9**  | Fix TypeSpec direct compilation              | +1 test              | Low    | Medium         | 30min  |
| **10** | Add DiscoveryService behavior tests          | +5 tests             | Medium | Medium         | 50min  |
| **11** | Add ProcessingService behavior tests         | +5 tests             | Medium | Medium         | 50min  |
| **12** | Add DocumentBuilder behavior tests           | +5 tests             | Medium | Medium         | 50min  |
| **13** | Add ValidationService behavior tests         | +5 tests             | Medium | Medium         | 50min  |
| **14** | Add EmissionPipeline integration tests       | +5 tests             | Medium | Medium         | 50min  |
| **15** | Fix remaining schema validation tests        | +10 tests            | High   | Medium         | 80min  |
| **16** | Add plugin error handling tests              | +4 tests             | Low    | Low            | 40min  |
| **17** | Add security scheme tests                    | +5 tests             | Medium | Low            | 50min  |
| **18** | Add server configuration tests               | +5 tests             | Medium | Low            | 50min  |
| **19** | Performance optimization tests               | +3 tests             | Medium | Low            | 60min  |
| **20** | Clean up deprecated test infrastructure      | +0 tests             | High   | Low            | 100min |

**Total**: 20 tasks, **+97 tests** (exceeds +92 target!), **~1200 minutes (20 hours)**

---

## ⏱️ Micro-Tasks (≤12 minutes each)

### 🚨 CRITICAL PATH (Do FIRST) - 2.5 hours

| #       | Task                                                   | Time  | Impact | Files                                    |
| ------- | ------------------------------------------------------ | ----- | ------ | ---------------------------------------- |
| **C1**  | Read AsyncAPIEmitter.ts to understand file output      | 10min | +0     | N/A                                      |
| **C2**  | Fix JSON output test file path                         | 5min  | +1     | test/unit/emitter-core.test.ts:105-115   |
| **C3**  | Fix YAML output test file path                         | 5min  | +1     | test/unit/emitter-core.test.ts:117-131   |
| **C4**  | Fix default YAML test file path                        | 5min  | +1     | test/unit/emitter-core.test.ts:133-142   |
| **C5**  | Fix default filename test file path                    | 5min  | +1     | test/unit/emitter-core.test.ts:144-152   |
| **C6**  | Commit file path fixes                                 | 2min  | -      | git commit                               |
| **C7**  | Read ValidationService.ts to understand binding issue  | 12min | +0     | src/domain/services/ValidationService.ts |
| **C8**  | Extract validateDocument to standalone Effect function | 12min | +5     | src/domain/services/ValidationService.ts |
| **C9**  | Update ValidationService to use standalone function    | 12min | +5     | src/domain/services/ValidationService.ts |
| **C10** | Test ValidationService binding fix                     | 12min | +10    | bun test validation                      |
| **C11** | Commit ValidationService fix                           | 2min  | -      | git commit                               |
| **C12** | Read @server decorator implementation                  | 10min | +0     | src/decorators/server.ts                 |
| **C13** | Fix @server compilation errors (Part 1)                | 12min | +3     | src/decorators/server.ts                 |
| **C14** | Fix @server compilation errors (Part 2)                | 12min | +4     | src/decorators/server.ts                 |
| **C15** | Fix @server validation logic                           | 12min | +3     | src/decorators/server.ts                 |
| **C16** | Commit @server decorator fixes                         | 2min  | -      | git commit                               |

**Subtotal**: 16 micro-tasks, **+34 tests**, **138 minutes (2.3 hours)**

### 🔥 HIGH-VALUE FIXES - 2.5 hours

| #       | Task                                     | Time  | Impact | Files                                      |
| ------- | ---------------------------------------- | ----- | ------ | ------------------------------------------ |
| **H1**  | Read @subscribe decorator implementation | 10min | +0     | src/decorators/subscribe.ts                |
| **H2**  | Fix @subscribe basic compilation         | 12min | +1     | src/decorators/subscribe.ts                |
| **H3**  | Fix @subscribe multiple operations       | 12min | +1     | src/decorators/subscribe.ts                |
| **H4**  | Fix @subscribe complex messages          | 12min | +1     | src/decorators/subscribe.ts                |
| **H5**  | Fix @subscribe parameterized channels    | 12min | +1     | src/decorators/subscribe.ts                |
| **H6**  | Commit @subscribe fixes                  | 2min  | -      | git commit                                 |
| **H7**  | Read protocol binding integration code   | 10min | +0     | src/plugins/                               |
| **H8**  | Fix Kafka protocol integration test      | 12min | +1     | test/integration/protocol-bindings.test.ts |
| **H9**  | Fix WebSocket protocol integration       | 12min | +1     | test/integration/protocol-bindings.test.ts |
| **H10** | Fix HTTP protocol integration            | 12min | +1     | test/integration/protocol-bindings.test.ts |
| **H11** | Fix AMQP protocol integration            | 12min | +1     | test/integration/protocol-bindings.test.ts |
| **H12** | Fix protocol error handling tests        | 12min | +4     | test/integration/protocol-bindings.test.ts |
| **H13** | Commit protocol binding fixes            | 2min  | -      | git commit                                 |
| **H14** | Fix command name detection               | 12min | +1     | src/utils/command-detection.ts             |
| **H15** | Commit command detection fix             | 2min  | -      | git commit                                 |

**Subtotal**: 15 micro-tasks, **+13 tests**, **136 minutes (2.3 hours)**

### ✨ ADDITIONAL VALUE - 3 hours

| #       | Task                                          | Time  | Impact | Files                                                      |
| ------- | --------------------------------------------- | ----- | ------ | ---------------------------------------------------------- |
| **A1**  | Fix mock elimination test #1                  | 12min | +1     | test/breakthroughs/mock-infrastructure-elimination.test.ts |
| **A2**  | Fix mock elimination test #2                  | 12min | +1     | test/breakthroughs/mock-infrastructure-elimination.test.ts |
| **A3**  | Fix simple mock elimination                   | 12min | +1     | test/breakthroughs/simple-mock-elimination.test.ts         |
| **A4**  | Commit mock elimination fixes                 | 2min  | -      | git commit                                                 |
| **A5**  | Fix TypeSpec direct compilation               | 12min | +1     | test/breakthroughs/typespec-direct-compilation.test.ts     |
| **A6**  | Commit TypeSpec compilation fix               | 2min  | -      | git commit                                                 |
| **A7**  | Create DiscoveryService behavior test file    | 10min | +0     | test/domain/services/DiscoveryService.test.ts              |
| **A8**  | Add 5 DiscoveryService behavior tests         | 12min | +5     | test/domain/services/DiscoveryService.test.ts              |
| **A9**  | Commit DiscoveryService tests                 | 2min  | -      | git commit                                                 |
| **A10** | Create ProcessingService behavior test file   | 10min | +0     | test/domain/services/ProcessingService.test.ts             |
| **A11** | Add 5 ProcessingService behavior tests        | 12min | +5     | test/domain/services/ProcessingService.test.ts             |
| **A12** | Commit ProcessingService tests                | 2min  | -      | git commit                                                 |
| **A13** | Create DocumentBuilder behavior test file     | 10min | +0     | test/domain/services/DocumentBuilder.test.ts               |
| **A14** | Add 5 DocumentBuilder behavior tests          | 12min | +5     | test/domain/services/DocumentBuilder.test.ts               |
| **A15** | Commit DocumentBuilder tests                  | 2min  | -      | git commit                                                 |
| **A16** | Add 5 ValidationService behavior tests        | 12min | +5     | test/domain/services/ValidationService.test.ts             |
| **A17** | Commit ValidationService tests                | 2min  | -      | git commit                                                 |
| **A18** | Create EmissionPipeline integration test file | 10min | +0     | test/integration/EmissionPipeline.test.ts                  |
| **A19** | Add 5 EmissionPipeline integration tests      | 12min | +5     | test/integration/EmissionPipeline.test.ts                  |
| **A20** | Commit EmissionPipeline tests                 | 2min  | -      | git commit                                                 |

**Subtotal**: 20 micro-tasks, **+29 tests**, **150 minutes (2.5 hours)**

---

## 📊 TOTAL MICRO-TASK SUMMARY

| Category          | Tasks  | Tests   | Time     |
| ----------------- | ------ | ------- | -------- |
| **Critical Path** | 16     | +34     | 2.3h     |
| **High-Value**    | 15     | +13     | 2.3h     |
| **Additional**    | 20     | +29     | 2.5h     |
| **TOTAL**         | **51** | **+76** | **7.1h** |

**Expected Result**: 408 + 76 = **484 passing (87%)** - Close to 90% target!

---

## 🗑️ DELETED FROM PREVIOUS PLAN (Scope Creep)

- Documentation tasks (do AFTER tests pass)
- Architecture diagrams (do AFTER tests pass)
- Performance optimization (do AFTER tests pass)
- Alpha emitter deletion (do AFTER Beta verified)
- Code cleanup tasks (do AFTER tests pass)
- ESLint warning fixes (do AFTER critical bugs fixed)
- GitHub issue management (do at end of session)

**Total Deleted**: 128 tasks that don't directly improve test pass rate

---

## 🎯 EXECUTION STRATEGY

1. **Do Critical Path first** (C1-C16) = 2.3 hours → +34 tests → 408→442 (79%)
2. **Then High-Value** (H1-H15) = 2.3 hours → +13 tests → 442→455 (82%)
3. **Then Additional** (A1-A20) = 2.5 hours → +29 tests → 455→484 (87%)
4. **Verify & Commit** = 0.5 hours → Final test run and push
5. **Total Time**: 7.5 hours to reach 87% pass rate

**If time permits**: Add more behavior tests to reach 90%+

---

## 📈 SUCCESS METRICS

| Metric               | Start   | Target   | Progress    |
| -------------------- | ------- | -------- | ----------- |
| **Test Pass Rate**   | 73.4%   | 90%+     | Need +16.6% |
| **Passing Tests**    | 408/556 | 500+/556 | Need +92    |
| **After Critical**   | 442/556 | 79.5%    | +34 tests   |
| **After High-Value** | 455/556 | 81.8%    | +47 tests   |
| **After Additional** | 484/556 | 87.1%    | +76 tests   |

---

## 🚀 NEXT STEPS

1. ✅ Create this plan
2. ✅ Commit planning documents
3. ⏭️ **START C1**: Read AsyncAPIEmitter.ts to understand file output
4. Execute C1→C16 (Critical Path)
5. Execute H1→H15 (High-Value)
6. Execute A1→A20 (Additional)
7. Final test run and verification
8. Git push and session summary

**LET'S GET SHIT DONE!** 🔥
