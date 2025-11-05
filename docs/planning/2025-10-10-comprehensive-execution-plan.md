# Comprehensive Execution Plan - 2025-10-10

## 🎯 Planning Principles

### 1. Research Existing Code First
- ✅ Check what types we already have
- ✅ Check what validation exists
- ✅ Check what libraries we use
- ✅ Leverage existing patterns

### 2. Small, Verifiable Steps
- Each step: 5-15 minutes
- Commit after each self-contained change
- Verify build/tests pass
- Push when done

### 3. High Value First
- Focus on user-facing improvements
- Avoid perfectionism on internal code
- Real-world examples > internal refactoring

### 4. Leverage Existing Libraries
- @asyncapi/parser for types
- Existing validation-helpers.ts
- Effect.TS patterns already in codebase
- Don't reinvent the wheel

---

## 📊 TASK PRIORITY MATRIX

Sorted by: **Impact / Effort = Priority Score**

| # | Task | Impact | Effort | Score | Time | Category |
|---|------|--------|--------|-------|------|----------|
| 1 | Update branded-types.ts JSDoc to explain integration | 3 | 10min | 0.3 | 10min | Documentation |
| 2 | Fix Bun matcher in cli-test-template.test.ts | 5 | 10min | 0.5 | 10min | Test Quality |
| 3 | Create real-world Kafka example | 9 | 15min | 0.6 | 15min | User Value |
| 4 | Create real-world WebSocket example | 9 | 15min | 0.6 | 15min | User Value |
| 5 | Create real-world HTTP webhook example | 8 | 10min | 0.8 | 10min | User Value |
| 6 | Update README with examples links | 7 | 10min | 0.7 | 10min | Discoverability |
| 7 | Add branded types to type-guards.ts | 6 | 20min | 0.3 | 20min | Type Safety |
| 8 | Run bun audit and fix security issues | 8 | 30min | 0.27 | 30min | Production |
| 9 | Apply Bun matcher fix to options.test.ts | 5 | 30min | 0.17 | 30min | Test Quality |
| 10 | Integrate branded types into DocumentBuilder | 8 | 60min | 0.13 | 60min | Architecture |
| 11 | Create helper to convert @asyncapi types to branded | 6 | 45min | 0.13 | 45min | Type Safety |
| 12 | Fix remaining ESLint warnings (100+) | 4 | 120min | 0.03 | 120min | Code Quality |

---

## 🚀 PHASE 1: QUICK WINS (60 minutes total)

### Step 1: Document Branded Types Integration Plan (10min)
**Goal:** Explain how branded types will integrate with existing @asyncapi/parser types

**Existing Code to Leverage:**
- `src/types/index.ts` - Already uses @asyncapi/parser types
- `src/types/branded-types.ts` - Our new branded types

**Actions:**
1. Read src/types/index.ts comments about type architecture
2. Add JSDoc to branded-types.ts explaining:
   - These complement @asyncapi/parser types
   - Used for compile-time safety of string identifiers
   - Integration planned for DocumentBuilder
3. Add examples of intended usage
4. Commit: "docs: Explain branded types integration with @asyncapi/parser"

**Value:** Prevents future confusion, documents intent

---

### Step 2: Fix Bun Matcher in Template Test (10min)
**Goal:** Apply discovered Bun matcher fix to template test

**Existing Code to Leverage:**
- `test/integration/cli-simple-emitter.test.ts` - Has correct pattern
- `docs/testing/BUN-TEST-PATTERNS.md` - Documents the fix

**Actions:**
1. Open test/templates/cli-test-template.test.ts
2. Find line 137: `expect(testResult.asyncapiDoc?.channels).toHaveProperty('edge.case')`
3. Replace with pattern from cli-simple-emitter.test.ts:
   ```typescript
   const channelKeys = getPropertyKeys(testResult.asyncapiDoc.channels)
   expect(channelKeys).toContain('edge.case')
   ```
4. Verify test still compiles
5. Commit: "fix: Apply Bun matcher fix to template test"

**Value:** Template propagates correct pattern to all future tests

---

### Step 3: Create Real-World Kafka Example (15min)
**Goal:** Give users a copy-paste Kafka integration example

**Existing Code to Leverage:**
- `examples/smoke/main.tsp` - Has basic structure
- Existing Kafka decorator in lib/main.tsp

**Actions:**
1. Create `examples/real-world/kafka-events.tsp`
2. Use realistic event names (UserCreated, OrderPlaced, etc.)
3. Add Kafka-specific decorators
4. Include README.md explaining the example
5. Verify it compiles: `cd examples/real-world && tsp compile kafka-events.tsp --emit @lars-artmann/typespec-asyncapi`
6. Commit: "docs: Add real-world Kafka events example"

**Template:**
```typescript
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

@asyncAPI({
  title: "E-Commerce Event System",
  version: "1.0.0",
  description: "Kafka-based event-driven microservices"
})
namespace ECommerce;

@server("kafka-prod", "kafka://kafka.example.com:9092", {
  protocol: "kafka",
  description: "Production Kafka cluster"
})

model UserCreatedEvent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
}

model OrderPlacedEvent {
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: decimal;
  placedAt: utcDateTime;
}

model OrderItem {
  productId: string;
  quantity: int32;
  price: decimal;
}

@channel("users.created")
@publish
@asyncAPI("Published when a new user registers")
op publishUserCreated(...UserCreatedEvent): void;

@channel("orders.placed")
@publish
@asyncAPI("Published when an order is placed")
op publishOrderPlaced(...OrderPlacedEvent): void;

@channel("users.created")
@subscribe
@asyncAPI("Subscribe to user creation events")
op subscribeUserCreated(...UserCreatedEvent): void;
```

**Value:** High - Users can immediately see how to use emitter for Kafka

---

### Step 4: Create Real-World WebSocket Example (15min)
**Goal:** WebSocket chat application example

**Actions:**
1. Create `examples/real-world/websocket-chat.tsp`
2. Model chat messages, connections, typing indicators
3. WebSocket protocol decorators
4. README with explanation
5. Verify compilation
6. Commit: "docs: Add real-world WebSocket chat example"

**Value:** High - Shows real-time communication patterns

---

### Step 5: Create Real-World HTTP Webhook Example (10min)
**Goal:** HTTP webhook delivery pattern

**Actions:**
1. Create `examples/real-world/http-webhooks.tsp`
2. Model webhook payloads, headers, signatures
3. HTTP protocol decorators
4. README with security considerations
5. Verify compilation
6. Commit: "docs: Add real-world HTTP webhooks example"

**Value:** High - Common enterprise pattern

---

### Step 6: Update README with Examples (10min)
**Goal:** Make examples discoverable

**Existing Code to Leverage:**
- Main README.md
- examples/ directory structure

**Actions:**
1. Add "Real-World Examples" section to README
2. Link to examples/real-world/ directory
3. Brief description of each example
4. Explain how to run them
5. Commit: "docs: Add real-world examples section to README"

**Value:** High - Discoverability for users

---

## 🏗️ PHASE 2: TYPE ARCHITECTURE (90 minutes total)

### Step 7: Add Branded Type Guards to test-utils (20min)
**Goal:** Make branded types available in tests

**Existing Code to Leverage:**
- `test/utils/type-guards.ts` - Already has type guards
- `src/types/branded-types.ts` - Has validation functions

**Actions:**
1. Import branded types into type-guards.ts
2. Add helper: `assertValidChannelName(value: string): ChannelName`
3. Add helper: `assertValidOperationName(value: string): OperationName`
4. Use in assertAsyncAPIDoc to validate structure AND names
5. Commit: "feat: Add branded type assertions to test type guards"

**Value:** Tests can use branded types for better safety

---

### Step 8: Security Audit (30min)
**Goal:** Production requirement - no vulnerabilities

**Actions:**
1. Run `bun audit` (or `bun pm audit`)
2. Review vulnerability report
3. Update vulnerable dependencies
4. Test that emitter still works
5. Verify build passes
6. Commit: "chore: Fix security vulnerabilities from audit"

**Value:** High - Required for production

---

### Step 9: Apply Bun Matcher Fix to options.test.ts (30min)
**Goal:** Fix matcher usage in options tests

**Existing Code to Leverage:**
- `docs/testing/BUN-TEST-PATTERNS.md` - Pattern guide
- `test/integration/cli-simple-emitter.test.ts` - Working example

**Actions:**
1. Open test/unit/options.test.ts
2. Find all `toHaveProperty` usages (12 occurrences)
3. Analyze if they're testing AsyncAPI docs or regular objects
4. Replace AsyncAPI doc checks with Object.keys() pattern
5. Keep regular object checks (those work fine)
6. Run tests to verify
7. Commit: "refactor: Apply Bun matcher fix to options tests"

**Value:** Medium - Test reliability

---

### Step 10: Document Type Integration Strategy (30min)
**Goal:** Clear plan for using branded types in emitter

**Actions:**
1. Create `docs/architecture/type-system.md`
2. Document three type layers:
   - Layer 1: @asyncapi/parser types (official spec)
   - Layer 2: Branded types (compile-time safety)
   - Layer 3: Emitter types (EmitterAsyncAPIObject)
3. Explain integration points
4. Show example of converting between layers
5. Document when to use each layer
6. Commit: "docs: Document type system architecture"

**Value:** Guides future development

---

## 🔧 PHASE 3: TYPE INTEGRATION (120 minutes total)

### Step 11: Create Type Conversion Helpers (45min)
**Goal:** Safe conversion between @asyncapi types and branded types

**Existing Code to Leverage:**
- `src/types/branded-types.ts` - Validation functions
- `src/types/index.ts` - @asyncapi/parser types
- `src/utils/validation-helpers.ts` - Existing validation patterns

**Actions:**
1. Create `src/utils/type-conversion-helpers.ts`
2. Add function: `extractChannelNames(doc: AsyncAPIObject): ChannelName[]`
3. Add function: `extractOperationNames(doc: AsyncAPIObject): OperationName[]`
4. Add function: `validateChannelName(name: string): Either<Error, ChannelName>`
5. Use Effect.TS Either for error handling
6. Add tests in test/unit/type-conversion-helpers.test.ts
7. Commit: "feat: Add type conversion helpers for branded types"

**Value:** Bridge between official types and branded types

---

### Step 12: Integrate Branded Types in DocumentBuilder (60min)
**Goal:** Use branded types in core emitter code

**Existing Code to Leverage:**
- `src/infrastructure/DocumentBuilder.ts` - Main builder class
- `src/utils/type-conversion-helpers.ts` - New conversion helpers

**Actions:**
1. Read DocumentBuilder.ts to understand structure
2. Identify where channel/operation names are created
3. Add branded type validation at creation points
4. Update function signatures to use ChannelName, OperationName
5. Add runtime validation with clear error messages
6. Update tests to handle new types
7. Verify all tests still pass
8. Commit: "feat: Integrate branded types into DocumentBuilder"

**Value:** High - Compile-time safety in core code

---

### Step 13: Update Type Exports (15min)
**Goal:** Make branded types available to emitter users

**Existing Code to Leverage:**
- `src/types/index.ts` - Main type exports

**Actions:**
1. Add exports for branded types
2. Add type aliases for common combinations
3. Update JSDoc with usage examples
4. Commit: "feat: Export branded types from main types module"

**Value:** API completeness

---

## 🧹 PHASE 4: CODE QUALITY (Optional - 120 minutes)

### Step 14: Fix High-Priority ESLint Warnings (60min)
**Goal:** Address most impactful code quality issues

**Actions:**
1. Run `bun run lint | grep "error"` to find remaining errors
2. Focus on type-cache.ts and schema-conversion.ts
3. Fix explicit-any violations
4. Fix unsafe-argument issues
5. Run tests after each fix
6. Commit per file: "refactor: Fix ESLint violations in [file]"

**Value:** Medium - Code quality, but not user-facing

---

### Step 15: Custom Bun Matchers (60min)
**Goal:** Better test DX with domain-specific matchers

**Existing Code to Leverage:**
- `test/utils/type-guards.ts` - Assertion functions
- Bun test API documentation

**Actions:**
1. Create `test/utils/custom-matchers.ts`
2. Implement: `toHaveChannel(name: ChannelName)`
3. Implement: `toHaveOperation(name: OperationName)`
4. Implement: `toBeValidAsyncAPI()`
5. Register matchers with Bun
6. Update tests to use new matchers
7. Commit: "feat: Add custom Bun matchers for AsyncAPI testing"

**Value:** Medium - Test DX improvement

---

## 🎯 RECOMMENDED EXECUTION ORDER

### TODAY (90 minutes)
1. ✅ Document branded types integration (10min) - COMMIT
2. ✅ Fix Bun matcher in template (10min) - COMMIT
3. ✅ Kafka example (15min) - COMMIT
4. ✅ WebSocket example (15min) - COMMIT
5. ✅ HTTP webhooks example (10min) - COMMIT
6. ✅ Update README (10min) - COMMIT
7. ✅ Security audit (30min) - COMMIT
8. **PUSH ALL COMMITS**

**Result:** Users get real-world examples, security issues fixed, build stable

### TOMORROW (120 minutes)
1. Type conversion helpers (45min) - COMMIT
2. Document type system architecture (30min) - COMMIT
3. Branded type guards in tests (20min) - COMMIT
4. Apply Bun matcher to options.test.ts (30min) - COMMIT
5. **PUSH ALL COMMITS**

**Result:** Type system architecture documented and tested

### THIS WEEK (120 minutes)
1. Integrate branded types in DocumentBuilder (60min) - COMMIT
2. Update type exports (15min) - COMMIT
3. Fix high-priority ESLint (60min) - COMMIT
4. **PUSH ALL COMMITS**

**Result:** Core emitter uses branded types for safety

---

## 🔑 KEY INSIGHTS

### What We Learned:
1. **Always check existing code first**
   - We had @asyncapi/parser types
   - We had validation-helpers.ts
   - Saved 282 lines of redundant code

2. **Leverage official libraries**
   - @asyncapi/parser is maintained by AsyncAPI team
   - More reliable than custom types
   - Automatically stays updated

3. **Effect Schema has its place**
   - Good for OPTIONS validation (infrastructure/configuration/)
   - NOT needed for AsyncAPI document types
   - Follow existing patterns

4. **Branded types add real value**
   - Compile-time safety for string identifiers
   - No runtime overhead
   - Complements official types

### Architecture Principles:
1. **Three Type Layers:**
   - Official types (@asyncapi/parser) - Ground truth
   - Branded types (compile-time safety) - Developer experience
   - Validation (runtime checks) - Error detection

2. **Integration Points:**
   - DocumentBuilder creates branded types
   - Type guards validate and convert
   - Helpers bridge layers

3. **Simplicity:**
   - Use official types where possible
   - Add branded types for safety
   - Don't duplicate validation

---

## 📝 COMMIT MESSAGE TEMPLATE

```
<type>: <short description>

## Why This Change?
[Explain the problem this solves]

## What Changed?
[List specific changes]

## Existing Code Leveraged:
[What existing code/patterns did you use?]

## Impact:
[Build status, test status, user impact]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## ✅ SUCCESS CRITERIA

### Phase 1 (Today):
- [ ] Build passes ✅ (already fixed)
- [ ] 3 real-world examples committed
- [ ] README updated with examples
- [ ] Security audit complete
- [ ] All work pushed to remote

### Phase 2 (Tomorrow):
- [ ] Type system documented
- [ ] Conversion helpers implemented and tested
- [ ] Bun matcher applied to more tests
- [ ] Branded types in test utils

### Phase 3 (This Week):
- [ ] DocumentBuilder uses branded types
- [ ] All tests pass with new types
- [ ] ESLint high-priority issues fixed
- [ ] Type exports complete

---

**Status:** Ready to execute Phase 1 (90 minutes of high-value work)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
