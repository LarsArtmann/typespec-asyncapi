# Optimized Execution Plan - Sorted by Impact/Work Ratio

**Date:** 2026-03-20 23:58  
**Current Status:** Phase 1 Partially Complete (Security, Tags, CorrelationId done)  
**Goal:** Complete remaining tasks sorted by highest ROI

---

## Formula: Priority Score = Impact / Effort (higher = better ROI)

---

## Tier S (Critical ROI > 4.0) - Execute First

| #   | Task                                      | Impact | Effort (min) | Score   | Status       |
| --- | ----------------------------------------- | ------ | ------------ | ------- | ------------ |
| S1  | Add protocol bindings to channels         | 9      | 15           | **6.0** | 🔴 NOT DONE  |
| S2  | Add security to operations                | 8      | 15           | **5.3** | 🔴 NOT DONE  |
| S3  | Create integration test for security      | 10     | 20           | **5.0** | 🟡 ATTEMPTED |
| S4  | Create integration test for tags          | 10     | 20           | **5.0** | 🔴 NOT DONE  |
| S5  | Create integration test for correlationId | 10     | 20           | **5.0** | 🔴 NOT DONE  |

---

## Tier A (High ROI 2.5-4.0)

| #   | Task                                   | Impact | Effort (min) | Score   | Status       |
| --- | -------------------------------------- | ------ | ------------ | ------- | ------------ |
| A1  | Add message headers output             | 7      | 20           | **3.5** | 🔴 NOT DONE  |
| A2  | Add protocol configs to state output   | 6      | 15           | **4.0** | 🔴 NOT DONE  |
| A3  | Fix security decorator for Model types | 8      | 25           | **3.2** | 🟡 ATTEMPTED |
| A4  | Complete Phase 1 commits               | 7      | 20           | **3.5** | 🟡 PARTIAL   |
| A5  | Add usage examples                     | 6      | 15           | **4.0** | 🔴 NOT DONE  |

---

## Tier B (Medium ROI 1.5-2.5)

| #   | Task                           | Impact | Effort (min) | Score   | Status      |
| --- | ------------------------------ | ------ | ------------ | ------- | ----------- |
| B1  | Add AsyncAPI output validation | 6      | 30           | **2.0** | 🔴 NOT DONE |
| B2  | Add discriminated union types  | 5      | 25           | **2.0** | 🔴 NOT DONE |
| B3  | Extract builder modules        | 5      | 30           | **1.7** | 🔴 NOT DONE |
| B4  | Add error handling             | 5      | 20           | **2.5** | 🔴 NOT DONE |
| B5  | Performance optimization       | 4      | 30           | **1.3** | 🔴 NOT DONE |

---

## Tier C (Lower ROI < 1.5)

| #   | Task                       | Impact | Effort (min) | Score    | Status      |
| --- | -------------------------- | ------ | ------------ | -------- | ----------- |
| C1  | Add metrics collection     | 3      | 30           | **1.0**  | 🔴 NOT DONE |
| C2  | Add tracing                | 3      | 40           | **0.75** | 🔴 NOT DONE |
| C3  | Documentation improvements | 4      | 60           | **0.67** | 🔴 NOT DONE |
| C4  | Refactor decorators        | 3      | 45           | **0.67** | 🔴 NOT DONE |
| C5  | Advanced optimizations     | 2      | 60           | **0.33** | 🔴 NOT DONE |

---

## Execution Order

### Sprint 1: Tier S (75 minutes)

1. **S1** - Protocol bindings (15 min)
2. **S2** - Security in operations (15 min)
3. **S3** - Security integration test (20 min)
4. **S4** - Tags integration test (10 min) - parallel with S3
5. **S5** - CorrelationId integration test (10 min) - parallel with S3

### Sprint 2: Tier A (95 minutes)

6. **A3** - Fix security decorator Model handling (25 min)
7. **A2** - Protocol configs in state (15 min)
8. **A1** - Message headers output (20 min)
9. **A5** - Usage examples (15 min)
10. **A4** - Phase 1 commits (20 min)

### Sprint 3: Tier B (105 minutes)

11. **B4** - Error handling (20 min)
12. **B1** - AsyncAPI validation (30 min)
13. **B2** - Discriminated unions (25 min)
14. **B3** - Extract builders (30 min)

### Sprint 4: Tier C (235 minutes - optional)

15. **C1-C5** - Polish tasks (optional based on time)

---

## Critical Issues to Fix

### Issue 1: Security Decorator Model Handling

**Problem:** Security decorator fails when config is passed as inline object
**Root Cause:** TypeSpec passes Model types, not plain objects
**Solution:** Fix `getConfigValue` helper to properly extract values from Model types

### Issue 2: Protocol Bindings Not Output

**Problem:** Protocol configs stored but never output to AsyncAPI
**Root Cause:** `buildChannels` doesn't read `state.protocolConfigs`
**Solution:** Add protocol bindings to channel entries

### Issue 3: Security Not in Operations

**Problem:** Security schemes defined but not referenced in operations
**Root Cause:** `buildOperations` doesn't add security references
**Solution:** Add security property to operation definitions

---

## Task Definitions

### S1: Add Protocol Bindings to Channels [15 min]

**Files:** `src/emitter-alloy.tsx`
**Steps:**

1. Read protocolConfigs from state in buildChannels
2. Format protocol bindings per AsyncAPI spec
3. Add bindings property to channel entries

**Expected Output:**

```yaml
channels:
  user/events:
    address: user/events
    bindings:
      kafka:
        partitions: 3
        replicationFactor: 2
```

### S2: Add Security to Operations [15 min]

**Files:** `src/emitter-alloy.tsx`
**Steps:**

1. Read securityConfigs from state in buildOperations
2. Add security property to operation definitions
3. Reference security schemes by name

**Expected Output:**

```yaml
operations:
  publishOrderEvent:
    security:
      - bearerAuth: []
```

### S3-S5: Integration Tests [40 min]

**Files:** `test/integration/metadata-features.test.ts`
**Steps:**

1. Fix security decorator to handle both Model and object
2. Create test file with all decorators
3. Run test and verify output
4. Fix any issues found

---

## Current State Summary

### ✅ Completed:

- Security decorator stores data
- Tags output in messages
- CorrelationId output in messages
- SecuritySchemes output in components
- Build passes (0 errors)
- Lint passes (0 warnings)
- 125 tests passing

### 🔴 Not Completed:

- Protocol bindings in channels
- Security references in operations
- Integration tests (security failing)
- Usage examples
- AsyncAPI validation

### 🟡 In Progress:

- Phase 1 wrap-up
- Security decorator fix

---

## Success Criteria

1. **Build:** Zero TypeScript errors
2. **Lint:** Zero ESLint warnings
3. **Tests:** All integration tests passing
4. **Output:** Valid AsyncAPI 3.0 spec
5. **Features:** All Phase 1 decorators working

---

## Immediate Next Actions

1. Fix security decorator Model handling
2. Add protocol bindings to channels
3. Add security references to operations
4. Create comprehensive integration test
5. Commit all changes

**Total Time:** ~75 minutes for Tier S completion
**Value:** 51% → 64% (completes Phase 1)

---

_Generated: 2026-03-20 23:58_  
_Status: Ready for Tier S execution_
