# 🧪 TypeSpec AsyncAPI Emitter - Testing Strategy

**Status:** ✅ **STANDARDIZED** - Hybrid BDD-First Approach  
**Date:** September 3, 2025  
**Architecture Decision:** BDD + Effect.TS + Traditional Unit Tests

---

## 🎯 TESTING PHILOSOPHY

**Primary Principle:** **Test behavior, not implementation**  
**Coverage Target:** 90% minimum (currently ~85%)  
**Framework:** Bun (fast, native TypeScript support)  
**Automation Level:** 100% automated, zero manual steps

---

## 🏗️ THREE-TIER TESTING ARCHITECTURE

### **Tier 1: BDD Behavior Specification (End-to-End Business Value)**

```typescript
// Location: test/behaviors/ (renamed from test/documentation/)
// Purpose: Verify TypeSpec → AsyncAPI transformation behaviors
// Pattern: Given-When-Then structure

describe("GIVEN a TypeSpec service with @channel decorator", () => {
  describe("WHEN emitting AsyncAPI specification", () => {
    it("THEN should generate valid AsyncAPI channel object", async () => {
      // Arrange: TypeSpec source with @channel
      const typeSpecCode = `
        @service({title: "User Service"})
        namespace UserService {
          @channel("user.events")
          op UserCreated(user: User): void;
        }
      `

      // Act: Run emitter pipeline
      const result = await compileTypeSpecToAsyncAPI(typeSpecCode)

      // Assert: Validate AsyncAPI output structure
      expect(result.channels["user.events"]).toBeDefined()
      expect(result.channels["user.events"].address).toBe("user.events")
    })
  })
})
```

**Characteristics:**

- **Focus:** End-to-end business value validation
- **Scope:** TypeSpec input → AsyncAPI output verification
- **Tools:** Custom Given-When-Then helpers + AsyncAPI validators
- **Coverage:** All decorator behaviors, protocol bindings, edge cases

### **Tier 2: Effect.TS Integration Testing (Service Interaction)**

```typescript
// Location: test/integration/
// Purpose: Test Effect.TS composition and error handling
// Pattern: Effect.runPromise with proper error boundaries

describe("ValidationService", () => {
  it("should validate AsyncAPI document with Effect.TS error handling", async () => {
    // Arrange
    const validationService = new ValidationService()
    const document = createValidAsyncApiDoc()

    // Act & Assert: Effect.TS composition
    const result = await Effect.runPromise(
      validationService.validateDocument(document)
    )

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should handle validation failures with Railway Programming", async () => {
    // Arrange
    const invalidDocument = createInvalidAsyncApiDoc()

    // Act: Effect.TS error handling
    const result = await Effect.runPromise(
      Effect.either(validationService.validateDocument(invalidDocument))
    )

    // Assert: Railway programming patterns
    expect(Effect.isLeft(result)).toBe(true)
    expect(result.left.message).toContain("Validation failed")
  })
})
```

**Characteristics:**

- **Focus:** Service interaction and data flow
- **Scope:** Effect.TS composition, Railway programming, error handling
- **Tools:** Effect.runPromise, Effect.either, proper error boundaries
- **Coverage:** Service integration, async orchestration, error chains

### **Tier 3: Traditional Unit Testing (Pure Functions)**

```typescript
// Location: test/unit/
// Purpose: Test pure functions and utilities
// Pattern: Traditional describe/it with focused assertions

describe("parseChannelAddress", () => {
  it("should extract channel name from TypeSpec operation", () => {
    // Arrange
    const operationName = "user.events.created"

    // Act
    const result = parseChannelAddress(operationName)

    // Assert
    expect(result).toEqual({
      domain: "user",
      event: "created",
      fullPath: "user.events.created"
    })
  })

  it("should handle single-level channel names", () => {
    expect(parseChannelAddress("notifications")).toEqual({
      domain: "notifications",
      event: null,
      fullPath: "notifications"
    })
  })
})
```

**Characteristics:**

- **Focus:** Algorithm correctness and edge cases
- **Scope:** Pure functions, utilities, data transformations
- **Tools:** Standard Jest/Bun assertions
- **Coverage:** Business logic units, type conversions, validators

---

## 📁 DIRECTORY STRUCTURE

```
test/
├── behaviors/              # Tier 1: BDD Behavior Tests
│   ├── channel-decorator.test.ts
│   ├── publish-subscribe.test.ts
│   ├── protocol-bindings.test.ts
│   └── end-to-end-scenarios.test.ts
│
├── integration/            # Tier 2: Effect.TS Integration
│   ├── validation-service.test.ts
│   ├── processing-pipeline.test.ts
│   ├── plugin-orchestration.test.ts
│   └── error-handling.test.ts
│
├── unit/                   # Tier 3: Pure Function Tests
│   ├── parsers/
│   ├── validators/
│   ├── transformers/
│   └── utilities/
│
└── helpers/                # Shared Test Infrastructure
    ├── typespec-compiler.ts
    ├── asyncapi-validator.ts
    ├── test-fixtures.ts
    └── effect-test-utils.ts
```

---

## 🔧 TEST CONFIGURATION & TOOLING

### **Primary Test Runner: Bun**

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:behaviors": "bun test test/behaviors/",
    "test:integration": "bun test test/integration/",
    "test:unit": "bun test test/unit/",
    "test:coverage": "bun test --coverage"
  }
}
```

### **Custom BDD Helpers**

```typescript
// test/helpers/bdd-helpers.ts
export const Given = (description: string, setupFn: () => any) => ({
  description,
  setup: setupFn
})

export const When = (action: string, actionFn: (context: any) => any) => ({
  action,
  execute: actionFn
})

export const Then = (expectation: string, assertionFn: (result: any) => void) => ({
  expectation,
  assert: assertionFn
})

export const BDDScenario = (given: any, when: any, then: any) => {
  return async () => {
    const context = await given.setup()
    const result = await when.execute(context)
    await then.assert(result)
  }
}
```

### **Effect.TS Test Utilities**

```typescript
// test/helpers/effect-test-utils.ts
export const runEffectTest = <A, E>(
  effect: Effect.Effect<A, E>
): Promise<A> => {
  return Effect.runPromise(effect)
}

export const expectEffectSuccess = async <A, E>(
  effect: Effect.Effect<A, E>
): Promise<A> => {
  const result = await Effect.runPromise(Effect.either(effect))
  if (Effect.isLeft(result)) {
    throw new Error(`Expected success but got error: ${result.left}`)
  }
  return result.right
}

export const expectEffectFailure = async <A, E>(
  effect: Effect.Effect<A, E>
): Promise<E> => {
  const result = await Effect.runPromise(Effect.either(effect))
  if (Effect.isRight(result)) {
    throw new Error(`Expected failure but got success: ${result.right}`)
  }
  return result.left
}
```

---

## 🎯 TESTING PATTERNS & BEST PRACTICES

### **BDD Test Pattern**

```typescript
describe("Feature: AsyncAPI Channel Generation", () => {
  describe("Scenario: Basic channel with message", () => {
    it("should generate valid channel specification", async () => {
      await BDDScenario(
        Given("a TypeSpec service with channel decorator", () => ({
          typespec: `
            @channel("orders.created")
            op OrderCreated(order: Order): void;
          `
        })),
        When("compiling to AsyncAPI", async (context) => {
          return await compileTypeSpecToAsyncAPI(context.typespec)
        }),
        Then("should produce valid AsyncAPI channel", (result) => {
          expect(result.channels["orders.created"]).toMatchObject({
            address: "orders.created",
            messages: {
              OrderCreated: {
                payload: { $ref: "#/components/schemas/Order" }
              }
            }
          })
        })
      )()
    })
  })
})
```

### **Effect.TS Test Pattern**

```typescript
describe("ProcessingService", () => {
  it("should process TypeSpec models with proper error handling", async () => {
    // Arrange
    const service = new ProcessingService()
    const program = await createTestProgram()
    const models = extractModelsFromProgram(program)

    // Act: Use Effect.TS composition
    const result = await runEffectTest(
      Effect.gen(function* () {
        const processedModels = []
        for (const model of models) {
          const processed = yield* service.processModel(model, program)
          processedModels.push(processed)
        }
        return processedModels
      })
    )

    // Assert
    expect(result).toHaveLength(models.length)
    result.forEach(processed => {
      expect(processed.isValid).toBe(true)
    })
  })
})
```

### **Unit Test Pattern**

```typescript
describe("AsyncAPIValidator", () => {
  describe("validateChannelAddress", () => {
    it.each([
      ["user.events", { valid: true, domain: "user", event: "events" }],
      ["notifications", { valid: true, domain: "notifications", event: null }],
      ["", { valid: false, error: "Empty channel address" }],
      ["user..events", { valid: false, error: "Invalid double dot" }]
    ])("should validate '%s' as %o", (address, expected) => {
      const result = validateChannelAddress(address)
      expect(result).toEqual(expected)
    })
  })
})
```

---

## 📊 COVERAGE & QUALITY METRICS

### **Coverage Requirements**

- **Overall Coverage:** ≥90% (currently 85%)
- **BDD Tests:** ≥95% end-to-end scenarios
- **Integration Tests:** ≥90% service interactions
- **Unit Tests:** ≥95% pure function coverage

### **Quality Gates**

- ✅ All tests must pass before merge
- ✅ Coverage threshold must be met
- ✅ No flaky tests allowed (>99% reliability)
- ✅ Test execution time <30 seconds total

### **Performance Benchmarks**

```typescript
describe("Performance Benchmarks", () => {
  it("should compile medium TypeSpec program in <2 seconds", async () => {
    const startTime = Date.now()
    await compileTypeSpecToAsyncAPI(MEDIUM_TYPESPEC_PROGRAM)
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(2000)
  })
})
```

---

## 🚀 MIGRATION PLAN

### **Phase 1: Immediate (Current)**

- [x] **Document this testing strategy**
- [ ] **Rename test/documentation → test/behaviors**
- [ ] **Create BDD helper utilities**
- [ ] **Standardize Effect.TS test patterns**

### **Phase 2: Short-term (1-2 weeks)**

- [ ] **Migrate existing tests to new structure**
- [ ] **Add missing BDD scenarios for all decorators**
- [ ] **Improve Effect.TS integration test coverage**
- [ ] **Achieve 90% coverage target**

### **Phase 3: Long-term (1 month)**

- [ ] **Add performance benchmarking automation**
- [ ] **Implement test data generation**
- [ ] **Add visual regression testing for generated specs**
- [ ] **Create test result analytics dashboard**

---

## 💡 KEY BENEFITS

### **For Developers**

- **Clear Testing Patterns:** Know exactly which test type to write
- **Faster Debugging:** BDD tests show business impact immediately
- **Reliable Refactoring:** High coverage enables confident changes

### **For Business**

- **Behavior Documentation:** BDD tests serve as living specifications
- **Quality Assurance:** 100% automation prevents manual testing bottlenecks
- **Risk Reduction:** Comprehensive coverage prevents production issues

### **For Architecture**

- **Effect.TS Validation:** Ensures functional programming patterns work correctly
- **Integration Confidence:** Services compose properly under all conditions
- **Regression Prevention:** Changes don't break existing functionality

---

## 🔗 RELATED DOCUMENTATION

- [Architectural Reflection Document](../planning/2025-09-03_COMPREHENSIVE_ARCHITECT_REFLECTION.md)
- [Package Structure Plan](../architecture/PACKAGE_STRUCTURE.md)
- [Effect.TS Integration Guide](../architecture/EFFECT_PATTERNS.md)
- [Testing Infrastructure Setup](./TESTING_INFRASTRUCTURE.md)

---

_This testing strategy implements the decisions from our comprehensive architectural analysis and provides the foundation for sustainable, high-quality development of the TypeSpec AsyncAPI Emitter._
