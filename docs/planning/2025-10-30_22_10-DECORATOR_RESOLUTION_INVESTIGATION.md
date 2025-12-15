# 🔍 TypeSpec Decorator Resolution Investigation & Fix Plan

## Date: 2025-10-30 22:10 CET

## Status: IN PROGRESS - Decorator "missing implementation" errors persisting

---

## 📋 EXECUTIVE SUMMARY

**PROBLEM:** TypeSpec reports "missing implementation" errors for ALL decorators despite:

- ✅ Decorators exist in `dist/decorators.js`
- ✅ `dist/index.js` exports decorators via `export * from "./decorators.js"`
- ✅ `dist/lib.js` NOW exports decorators (added today)
- ✅ Build compiles without errors
- ❌ Tests STILL fail with same errors

**ROOT CAUSE HYPOTHESIS:** TypeSpec decorator resolution mechanism not working as expected. Investigation reveals TypeSpec official templates do NOT export decorators from index.ts, suggesting auto-discovery mechanism.

**IMPACT:** ~400-500 tests failing due to decorator errors + channel ambiguity

---

## 🎯 WHAT WE FORGOT / COULD IMPROVE

### 1. Research First, Code Second

**What We Did Wrong:**

- Made assumptions about test infrastructure (node_modules staleness)
- Added decorator exports without understanding TypeSpec's resolution mechanism
- Didn't check TypeSpec official templates first

**What We Should Have Done:**

- Read TypeSpec documentation for decorator resolution
- Examined TypeSpec templates BEFORE making changes
- Created minimal reproduction case

### 2. Understanding TypeSpec Architecture

**Missed:** TypeSpec templates show decorators are NOT exported from index.ts
**Implication:** TypeSpec uses different resolution mechanism than we assumed
**Need:** Deep dive into TypeSpec source code or documentation

### 3. Test-Driven Approach

**Should Have:** Created minimal failing test FIRST
**Then:** Made smallest change to fix it
**Then:** Verified fix works before proceeding

---

## 🔬 CRITICAL DISCOVERIES

### TypeSpec Official Template Structure

```typescript
// index.ts - Main entry point
export { getAlternateName } from "./decorators.js";  // Helper ONLY
export { $lib } from "./lib.js";                       // Library def

// decorators.ts - Decorator implementations
export function $alternateName(...) { ... }  // ❌ NOT exported from index!
export function getAlternateName(...) { ... } //  ✅ Helper IS exported

// lib.ts - Library definition ONLY
export const $lib = createTypeSpecLibrary({ ... })  // ❌ NO decorator exports
```

**KEY INSIGHT:** Decorators (`$alternateName`) are NOT re-exported from index.ts!

### Our Current Structure

```typescript
// src/index.ts
export * from "./decorators.js"  // ✅ Exports all decorators + helpers

// src/decorators.ts
export { $channel } from "./domain/decorators/channel.js"
export { $publish } from "./domain/decorators/publish.js"
// ... all 11 decorators

// src/lib.ts (NEWLY ADDED)
export * from "./decorators.js"  // ✅ NOW exports decorators (after today's fix)
```

**QUESTION:** Why does our structure not work when it seems more comprehensive?

---

## 📊 COMPREHENSIVE MULTI-STEP EXECUTION PLAN

### Phase 1: UNDERSTAND (Research & Discovery) - 2-3 hours

| Step | Task                                                 | Time | Impact   | Priority |
| ---- | ---------------------------------------------------- | ---- | -------- | -------- |
| 1.1  | Read TypeSpec docs on decorator resolution           | 30m  | CRITICAL | 🔴 NOW   |
| 1.2  | Examine TypeSpec compiler source (decorator loading) | 45m  | CRITICAL | 🔴 NOW   |
| 1.3  | Check package.json exports field requirements        | 15m  | HIGH     | 🔴 NOW   |
| 1.4  | Create minimal TypeSpec library test case            | 30m  | CRITICAL | 🔴 NOW   |
| 1.5  | Test minimal case to verify decorator resolution     | 15m  | CRITICAL | 🔴 NOW   |
| 1.6  | Compare our structure vs working TypeSpec library    | 30m  | HIGH     | 🟡 SOON  |

**Total Phase 1:** ~2.5 hours
**Expected Outcome:** Understanding of HOW TypeSpec resolves decorators

### Phase 2: FIX DECORATOR RESOLUTION (Implementation) - 1-2 hours

| Step | Task                                         | Time | Impact   | Priority |
| ---- | -------------------------------------------- | ---- | -------- | -------- |
| 2.1  | Implement correct decorator export structure | 20m  | CRITICAL | 🔴 NOW   |
| 2.2  | Update package.json if needed                | 10m  | HIGH     | 🔴 NOW   |
| 2.3  | Rebuild and verify dist/ structure           | 10m  | HIGH     | 🔴 NOW   |
| 2.4  | Test single decorator test case              | 15m  | CRITICAL | 🔴 NOW   |
| 2.5  | Run full decorator test suite                | 20m  | HIGH     | 🟡 SOON  |
| 2.6  | Verify all 11 decorators work                | 20m  | HIGH     | 🟡 SOON  |

**Total Phase 2:** ~1.5 hours
**Expected Outcome:** Decorators correctly resolved by TypeSpec

### Phase 3: FIX CHANNEL AMBIGUITY (Quick Win) - 30 minutes

| Step | Task                                       | Time | Impact | Priority |
| ---- | ------------------------------------------ | ---- | ------ | -------- |
| 3.1  | Update lib/main.tsp to use qualified names | 10m  | MEDIUM | 🟡 SOON  |
| 3.2  | OR: Remove global.channel conflict         | 10m  | MEDIUM | 🟡 SOON  |
| 3.3  | Test channel decorator usage               | 10m  | MEDIUM | 🟡 SOON  |

**Total Phase 3:** ~30 minutes
**Expected Outcome:** +50-100 tests passing

### Phase 4: PROPERTY ENUMERATION FIX (Original Issue) - 1 hour

| Step | Task                                             | Time | Impact   | Priority   |
| ---- | ------------------------------------------------ | ---- | -------- | ---------- |
| 4.1  | Debug why walkPropertiesInherited returns empty  | 30m  | CRITICAL | 🟡 AFTER 2 |
| 4.2  | Check if models are fully resolved when accessed | 20m  | CRITICAL | 🟡 AFTER 2 |
| 4.3  | Implement fix for property enumeration           | 10m  | CRITICAL | 🟡 AFTER 2 |

**Total Phase 4:** ~1 hour
**Expected Outcome:** +300-350 tests passing

### Phase 5: SPLIT-BRAIN FIX (Code Quality) - 30 minutes

| Step | Task                                                            | Time | Impact | Priority |
| ---- | --------------------------------------------------------------- | ---- | ------ | -------- |
| 5.1  | Replace model.properties.entries() with walkPropertiesInherited | 15m  | MEDIUM | 🟢 LATER |
| 5.2  | Replace model.properties.forEach with walkPropertiesInherited   | 15m  | MEDIUM | 🟢 LATER |

**Total Phase 5:** ~30 minutes
**Expected Outcome:** Consistent property enumeration

---

## 💡 REFLECTION: What Could We Use From Existing Code?

### 1. Leverage TypeSpec Test Utilities

**We Have:** `createAsyncAPITestLibrary()` in test-helpers.ts
**We Could:** Extract to reusable module for debugging decorator resolution
**Benefit:** Consistent test setup, easier debugging

### 2. Use TypeSpec's Official Test Patterns

**We Should:** Follow `node_modules/@typespec/compiler/templates/library-ts/src/testing/`
**Check:** If they have test utilities we're reinventing
**Benefit:** Battle-tested patterns, less debugging

### 3. Existing Validation Framework

**We Have:** AsyncAPI validator in `src/domain/validation/`
**We Could:** Use for verifying generated specs in tests
**Benefit:** Already implemented, comprehensive

### 4. Centralized Constants

**We Have:** `src/constants/` with paths, versions, defaults
**We Could:** Ensure ALL tests use these instead of hard-coding
**Benefit:** Single source of truth, easier maintenance

---

## 🏗️ TYPE MODEL IMPROVEMENTS

### 1. Branded Types for Type Safety

**Current:** Plain strings for decorator names, channel paths
**Should Be:** Branded types to prevent mixing

```typescript
// BEFORE (UNSAFE)
function setChannel(name: string) { ... }
setChannel("random-string")  // ❌ Accepts anything

// AFTER (SAFE)
type ChannelName = string & { __brand: "ChannelName" }
function createChannelName(value: string): ChannelName {
  // Validation here
  return value as ChannelName
}
function setChannel(name: ChannelName) { ... }
setChannel("random-string")  // ❌ Type error!
setChannel(createChannelName("users.created"))  // ✅ Type-safe
```

### 2. State Machines for Test Lifecycle

**Current:** Tests manually manage compilation → validation → assertion
**Should Be:** State machine enforcing correct transitions

```typescript
type TestState =
  | { phase: "setup"; config: TestConfig }
  | { phase: "compiling"; source: string }
  | { phase: "compiled"; program: Program }
  | { phase: "validating"; spec: AsyncAPIObject }
  | { phase: "complete"; result: TestResult }

// Impossible states become unrepresentable:
// - Can't validate without compiling first
// - Can't assert without validation
// - Clear lifecycle tracking
```

### 3. Effect.TS Railway Patterns

**Current:** Promise-based with manual error handling
**Should Be:** Effect.TS with automatic error propagation

```typescript
// BEFORE
try {
  const result = await compile(source)
  if (result.errors.length > 0) {
    throw new Error(...)
  }
  const spec = await validate(result)
  return spec
} catch (error) {
  // Manual error handling
}

// AFTER
const pipeline = pipe(
  compile(source),
  Effect.flatMap(validate),
  Effect.catchAll(handleError)
)
return Effect.runSync(pipeline)
```

---

## 📚 WELL-ESTABLISHED LIBS TO LEVERAGE

### 1. Zod for Runtime Validation

**Use For:** Test input validation, config validation
**Instead Of:** Manual validation code
**Benefit:** Type inference, clear error messages

```typescript
import { z } from "zod"

const TestConfigSchema = z.object({
  source: z.string().min(1),
  options: z.object({
    outputFile: z.string().optional(),
    fileType: z.enum(["json", "yaml"]).default("yaml")
  })
})

type TestConfig = z.infer<typeof TestConfigSchema>
```

### 2. ts-pattern for Pattern Matching

**Use For:** Handling TypeSpec AST node types
**Instead Of:** Giant switch statements
**Benefit:** Exhaustiveness checking, cleaner code

```typescript
import { match } from "ts-pattern"

const schemaType = match(type.kind)
  .with("Scalar", () => handleScalar(type))
  .with("Model", () => handleModel(type))
  .with("Union", () => handleUnion(type))
  .exhaustive()  // ✅ Compile error if case missing
```

### 3. fast-check for Property-Based Testing

**Use For:** Generating random valid TypeSpec models
**Instead Of:** Hard-coded test cases
**Benefit:** Finds edge cases, comprehensive coverage

```typescript
import fc from "fast-check"

fc.assert(
  fc.property(fc.record({
    name: fc.string(),
    type: fc.constantFrom("string", "number", "boolean")
  }), (prop) => {
    const result = convertPropertyToSchema(prop)
    expect(result.type).toBeDefined()
  })
)
```

---

## ✅ NEXT IMMEDIATE ACTIONS

1. **NOW (30 min):** Research TypeSpec decorator resolution in docs/source
2. **THEN (30 min):** Create minimal test case to verify resolution
3. **THEN (20 min):** Implement correct structure based on findings
4. **THEN (15 min):** Verify decorator errors are gone
5. **THEN (30 min):** Fix channel ambiguity
6. **THEN (1 hr):** Debug property enumeration
7. **COMMIT:** After each self-contained change
8. **PUSH:** When decorator resolution is working

---

## 🎯 SUCCESS CRITERIA

- ✅ Zero "missing implementation" errors
- ✅ Zero "ambiguous channel" errors
- ✅ Property enumeration returns actual properties (not empty)
- ✅ +400-500 tests passing
- ✅ All changes committed with clear messages
- ✅ Pushed to origin/master
- ✅ Documentation updated with findings

---

## 📝 NOTES & QUESTIONS

### Questions for Further Investigation:

1. **HOW does TypeSpec resolve `extern dec channel` → `$channel` implementation?**
   - Does it scan all exports from the package?
   - Does it look in a specific file?
   - Does it use package.json configuration?

2. **WHY doesn't our structure work when it exports MORE than the template?**
   - Are we exporting from wrong file?
   - Is there a conflict with multiple export paths?
   - Does TypeSpec expect specific naming?

3. **IS the decorator export from lib.ts even necessary?**
   - Template doesn't do it
   - Maybe we should REMOVE it instead?

### Hypothesis to Test:

**HYPOTHESIS A:** TypeSpec expects decorators ONLY in decorators.ts, not re-exported
**Test:** Remove export from lib.ts, keep only in decorators.ts
**Expected:** Decorators work

**HYPOTHESIS B:** Package.json exports field needs typespec-specific config
**Test:** Add exports field like official libraries
**Expected:** Decorators discovered correctly

**HYPOTHESIS C:** Test infrastructure issue, not library structure
**Test:** Use library in real TypeSpec project (not tests)
**Expected:** Works outside tests, fails in tests

---

**STATUS:** Ready to execute Phase 1 - Research & Discovery
**NEXT STEP:** Read TypeSpec documentation on decorator resolution
