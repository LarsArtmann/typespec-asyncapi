# EFFECT.TS ERROR HANDLING RECOVERY - COMPREHENSIVE EXECUTION PLAN

**Created:** 2025-11-21 14:25  
**Status:** READY FOR EXECUTION  
**Approach:** Research-driven, incremental, type-safe transformation

---

## 🎯 **EXECUTION PHILOSOPHY**

**Based on comprehensive research, this plan:**

1. **PRIORITIZES CRITICAL PATH** - railroadErrorRecovery to unblock 100+ tests
2. **ENHANCES EXISTING PATTERNS** - Leverages excellent branded type foundation
3. **MAINTAINS TYPE SAFETY** - Eliminates anti-patterns, prevents impossible states
4. **FOLLOWS EFFECT.TS BEST PRACTICES** - Production-grade Schema.TaggedError patterns
5. **PROVIDES IMMEDIATE VALUE** - Each step improves the system measurably

---

## 📊 **PRIORITY MATRIX - WORK vs IMPACT ANALYSIS**

### **🚨 CRITICAL PATH - MINIMAL WORK, MAXIMUM IMPACT**

| Step  | Task                                      | Est. Time | Impact                    | Risk | Dependencies |
| ----- | ----------------------------------------- | --------- | ------------------------- | ---- | ------------ |
| **1** | Implement railwayErrorRecovery module     | 45min     | Unblock 100+ tests        | LOW  | None         |
| **2** | Fix EffectResult<T> anti-pattern          | 20min     | Restore type safety       | LOW  | None         |
| **3** | Create basic Schema.TaggedError hierarchy | 30min     | Foundation for all errors | LOW  | Effect types |

### **⚡ HIGH IMPACT - MODERATE WORK, SYSTEM-WIDE BENEFITS**

| Step  | Task                                     | Est. Time | Impact                      | Risk   | Dependencies    |
| ----- | ---------------------------------------- | --------- | --------------------------- | ------ | --------------- |
| **4** | Replace 25 critical raw throw statements | 45min     | Type safety improvement     | MEDIUM | Error hierarchy |
| **5** | Implement structured logging system      | 30min     | Debugging experience        | LOW    | Effect logging  |
| **6** | Enhance branded type validation errors   | 40min     | Better developer experience | LOW    | Error hierarchy |

### **🎯 EXCELLENCE - HIGHER WORK, PRODUCTION READY**

| Step  | Task                                | Est. Time | Impact                | Risk   | Dependencies    |
| ----- | ----------------------------------- | --------- | --------------------- | ------ | --------------- |
| **7** | Add error classification utilities  | 25min     | Recovery mechanisms   | LOW    | Error system    |
| **8** | Integrate TypeSpec compiler errors  | 35min     | Ecosystem alignment   | MEDIUM | Error hierarchy |
| **9** | Implement retry & recovery patterns | 50min     | Production resilience | MEDIUM | All prior       |

**TOTAL ESTIMATED TIME:** 5.5 hours spread across focused implementation sessions

---

## 📋 **DETAILED STEP-BY-STEP EXECUTION PLAN**

### **STEP 1: IMPLEMENT railwayErrorRecovery MODULE (P0 - CRITICAL)**

**WHY:** Tests expect these functions but they're undefined, blocking 100+ tests.

**IMPLEMENTATION:**

```typescript
// /src/utils/railway-error-recovery.ts
export const railwayErrorRecovery = {
  retryWithBackoff: <A, E>(
    effect: Effect.Effect<A, E>,
    times: number = 3,
    minDelay: number = 100,
    maxDelay: number = 5000
  ): Effect.Effect<A, E> => {
    // Exponential backoff with jitter using Effect.retry
  },

  gracefulDegrade: <A, E>(
    primary: Effect.Effect<A, E>,
    fallback: A,
    message?: string
  ): Effect.Effect<A, never> => {
    // Fallback pattern with effect.catchAll + Effect.log
  },

  fallbackChain: <A, E>(
    effects: Array<Effect.Effect<A, E>>,
    fallback: A
  ): Effect.Effect<A, never> => {
    // Sequential fallbacks with Effect.firstSuccessOf
  },

  partialFailureHandling: <A, E>(
    effects: Array<Effect.Effect<A, E>>,
    successThreshold: number = 0.8
  ): Effect.Effect<{successes: A[], failures: E[]}, never> => {
    // Batch operations with threshold using Effect.all
  }
};
```

**VERIFICATION:** Run `bun test test/unit/railway-error-recovery.test.ts` - should pass

**COMMIT:** "feat: Implement railwayErrorRecovery module to unblock tests"

---

### **STEP 2: FIX EffectResult<T> ANTI-PATTERN (P0 - CRITICAL)**

**WHY:** Current pattern allows impossible states (both success and error data).

**CURRENT ANTI-PATTERN:**

```typescript
// /src/utils/effect-helpers.ts
export type EffectResult<T> = {
  data: T;
  error?: Error;  // 🚨 Both can be defined
}
```

**CORRECTED PATTERN:**

```typescript
// Replace with Effect.Effect or branded result
export type EffectResult<T, E = Error> = Effect.Effect<T, E>

// Or if a result type is needed, use Either
export type EffectResult<T, E = Error> = Either.Either<T, E>
```

**VERIFICATION:** TypeScript compilation confirms no type errors, tests pass

**COMMIT:** "fix: Remove EffectResult anti-pattern, use proper Effect types"

---

### **STEP 3: CREATE Schema.TaggedError HIERARCHY (P1 - FOUNDATION)**

**WHY:** Establishes production-grade error classification system.

**IMPLEMENTATION:**

```typescript
// /src/types/errors/asyncapi-error-hierarchy.ts
import { Schema } from "effect"

// DOMAIN ERRORS - Business validation failures
export class AsyncAPIValidationError extends Schema.TaggedError<AsyncAPIValidationError>()(
  "AsyncAPIValidationError",
  {
    message: Schema.String,
    field: Schema.optional(Schema.String),
    value: Schema.optional(Schema.Unknown),
    constraint: Schema.String,
    suggestion: Schema.optional(Schema.String),
  }
) {}

// INFRASTRUCTURE ERRORS
export class TypeSpecCompilationError extends Schema.TaggedError<TypeSpecCompilationError>()(
  "TypeSpecCompilationError",
  {
    message: Schema.String,
    source: Schema.optional(Schema.String),
    line: Schema.optional(Schema.Number),
    diagnosticCode: Schema.optional(Schema.String),
  }
) {}

export class FileSystemError extends Schema.TaggedError<FileSystemError>()(
  "FileSystemError",
  {
    message: Schema.String,
    operation: Schema.String.pipe(Schema.fromEnum(["read", "write", "delete", "mkdir", "exists"])),
    path: Schema.String,
    originalError: Schema.optional(Schema.String),
  }
) {}

// RUNTIME ERRORS
export class RuntimeError extends Schema.TaggedError<RuntimeError>()(
  "RuntimeError",
  {
    message: Schema.String,
    phase: Schema.optional(Schema.String),
    context: Schema.optional(Schema.Unknown),
  }
) {}

// Error union for comprehensive error handling
export type AsyncAPIError =
  | AsyncAPIValidationError
  | TypeSpecCompilationError
  | FileSystemError
  | RuntimeError
```

**VERIFICATION:** New error types compile, can be used with Effect.catchTags

**COMMIT:** "feat: Implement Schema.TaggedError hierarchy for typed error handling"

---

### **STEP 4: REPLACE CRITICAL RAW THROW STATEMENTS (P2 - TYPE SAFETY)**

**WHY:** 100+ raw throws bypass Effect.TS error handling patterns.

**TARGETED LOCATIONS (Starting Points):**

```typescript
// /src/emitter.ts:234 - Emit failures
Effect.fail(new FileSystemError({
  message: `Failed to generate ${outputPath}`,
  operation: "write",
  path: outputPath,
  originalError: String(error)
}))

// /src/types/domain/asyncapi-domain-types.ts - Validation errors
Effect.fail(new AsyncAPIValidationError({
  message: 'Schema name must be non-empty string',
  field: 'schemaName',
  value: schemaName,
  constraint: 'nonempty_string',
  suggestion: 'Provide a valid schema name'
}))

// Test files - Use Effect.fail instead of throw new Error()
```

**VERIFICATION:** TypeScript compilation, test patterns work correctly

**COMMIT:** "refactor: Replace raw throws with Effect.TS typed errors"

---

### **STEP 5: IMPLEMENT STRUCTURED LOGGING SYSTEM (P3 - DX)**

**WHY:** Replace console.log with Effect.TS aware logging system.

**IMPLEMENTATION:**

```typescript
// /src/utils/effect-logging.ts
export const effectLogging = {
  logWithContext: (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context: Record<string, unknown>
  ) => Effect.log(message).pipe(
    Effect.annotateLogs({
      level,
      timestamp: Date.now(),
      component: "AsyncAPIEmitter",
      ...context
    })
  ),

  logError: (error: Schema.TaggedError<any>, context?: Record<string, unknown>) =>
    Effect.logError(error.message).pipe(
      Effect.annotateLogs({
        errorType: error._tag,
        timestamp: Date.now(),
        ...context
      })
    ),

  logValidation: (field: string, value: unknown, error: AsyncAPIValidationError) =>
    effectLogging.logError(error, {
      validationField: field,
      attemptedValue: value,
      category: "validation"
    })
};

// Usage in validation functions:
return Effect.fail(
  new AsyncAPIValidationError({
    message: `Invalid channel path: ${path}`,
    field: 'channelPath',
    value: path,
    constraint: 'nonempty_path_starting_with_slash',
    suggestion: 'Channel paths must start with "/" and not be empty'
  })
).pipe(
  Effect.tapError(error => effectLogging.logValidation('channelPath', path, error))
)
```

**VERIFICATION:** Logs appear in test output, structure is consistent

**COMMIT:** "feat: Implement Effect.TS structured logging system"

---

### **STEP 6: ENHANCE BRANDED TYPE VALIDATION (P4 - USER EXPERIENCE)**

**WHY:** Current branded types have basic errors; enhance with context and suggestions.

**ENHANCED PATTERNS:**

```typescript
// /src/types/domain/asyncapi-branded-types.ts
export class ChannelPathError extends Schema.TaggedError<ChannelPathError>()(
  "ChannelPathError",
  {
    message: Schema.String,
    path: Schema.String,
    reason: Schema.String.pipe(Schema.fromEnum(["empty", "missing_slash", "invalid_format"])),
    suggestion: Schema.String,
  }
) {}

export const createChannelPath = (path: string): Effect.Effect<ChannelPath, ChannelPathError> => {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return Effect.fail(new ChannelPathError({
      message: `Channel path is invalid: received empty or non-string value`,
      path: String(path),
      reason: "empty",
      suggestion: 'Provide a non-empty string starting with "/"'
    }));
  }

  if (!path.startsWith('/')) {
    return Effect.fail(new ChannelPathError({
      message: `Channel path "${path}" must start with "/"`,
      path,
      reason: "missing_slash",
      suggestion: 'Channel paths must start with "/" - add leading slash'
    }));
  }

  if (path.includes(' ') || /[!@#$%^&*()]/.test(path) && !path.includes('{') && !path.includes('}')) {
    return Effect.fail(new ChannelPathError({
      message: `Channel path "${path}" contains invalid characters`,
      path,
      reason: "invalid_format",
      suggestion: 'Use only alphanumeric characters, slashes, and parameter placeholders like {userId}'
    }));
  }

  return Effect.succeed(path as ChannelPath)
};
```

**VERIFICATION:** Enhanced error messages appear in tests and compilation output

**COMMIT:** "enhance: Improve branded type validation with contextual error messages"

---

### **STEP 7: ADD ERROR CLASSIFICATION UTILITIES (P5 - RECOVERY)**

**WHY:** Enable intelligent error recovery and retry mechanisms.

**IMPLEMENTATION:**

```typescript
// /src/utils/error-classification.ts
export const errorClassification = {
  isRecoverable: (error: AsyncAPIError): boolean => {
    switch (error._tag) {
      case "FileSystemError":
        return error.operation === "read" || error.operation === "mkdir"
      case "TypeSpecCompilationError":
        return false // User must fix source
      case "AsyncAPIValidationError":
        return false // User must fix specification
      case "RuntimeError":
        return true // Usually transient
      default:
        return false
    }
  },

  getSeverity: (error: AsyncAPIError): "low" | "medium" | "high" | "critical" => {
    switch (error._tag) {
      case "AsyncAPIValidationError": return "medium"
      case "FileSystemError": return "high"
      case "TypeSpecCompilationError": return "critical"
      case "RuntimeError": return error.phase === "compilation" ? "critical" : "medium"
      default: return "medium"
    }
  },

  getRetryStrategy: (error: AsyncAPIError) => ({
    shouldRetry: errorClassification.isRecoverable(error),
    maxAttempts: error._tag === "FileSystemError" ? 3 : 1,
    baseDelay: error._tag === "FileSystemError" ? 100 : 0,
    backoffFactor: error._tag === "FileSystemError" ? 2 : 1
  })
};

// Integration with railwayErrorRecovery:
export const smartRetry = <A>(effect: Effect.Effect<A, AsyncAPIError>): Effect.Effect<A, AsyncAPIError> =>
  Effect.retry(effect, {
    while: (error, attempt) => {
      const strategy = errorClassification.getRetryStrategy(error)
      return strategy.shouldRetry && attempt < strategy.maxAttempts
    },
    schedule: Schedule.exponential("100 millis").pipe(Schedule.upTo("5 seconds"))
  })
```

**VERIFICATION:** Error classification tests pass, retry behavior works as expected

**COMMIT:** "feat: Add error classification utilities for intelligent recovery"

---

### **STEP 8: INTEGRATE TYPESPEC COMPILER ERRORS (P6 - ECOSYSTEM)**

**WHY:** Transform TypeSpec compiler diagnostics into Effect errors.

**IMPLEMENTATION:**

```typescript
// /src/utils/typespec-error-integration.ts
export const transformTypeSpecError = (
  diagnostic: any // TypeSpec diagnostic type
): TypeSpecCompilationError => new TypeSpecCompilationError({
  message: diagnostic.message || `TypeSpec compilation error: ${diagnostic.code}`,
  source: diagnostic.file?.path || "unknown",
  line: diagnostic.pos?.line,
  diagnosticCode: diagnostic.code,
  context: {
    severity: diagnostic.severity,
    category: diagnostic.category
  }
})

export const compileWithTypedErrors = (
  program: any,
  options: any
): Effect.Effect<any, TypeSpecCompilationError | FileSystemError> =>
  Effect.tryPromise({
    try: () => compiler.compile(program, options),
    catch: (error) => {
      if (error.code) {
        return transformTypeSpecError(error)
      } else if (error.message?.includes('ENOENT')) {
        return new FileSystemError({
          message: `File not found: ${error.path}`,
          operation: "read",
          path: error.path || "unknown",
          originalError: error.message
        })
      }
      return new RuntimeError({
        message: `Unexpected compilation error: ${String(error)}`,
        phase: "compilation",
        context: { originalError: error }
      })
    }
  })
```

**VERIFICATION:** TypeSpec errors transform correctly, compilation flow works

**COMMIT:** "feat: Integrate TypeSpec compiler errors with Effect.TS error system"

---

### **STEP 9: IMPLEMENT RETRY & RECOVERY PATTERNS (P7 - RESILIENCE)**

**WHY:** Production systems need sophisticated error recovery.

**IMPLEMENTATION:**

```typescript
// /src/utils/error-recovery-patterns.ts
export const recoveryPatterns = {
  // Resilient file operations with fallback
  resilientFileWrite: (path: string, content: string): Effect.Effect<void, never> =>
    Effect.gen(function*() {
      // Try primary location
      const primaryWrite = Effect.tryPromise({
        try: () => fs.writeFile(path, content),
        catch: (error) => new FileSystemError({
          message: `Failed to write ${path}`,
          operation: "write",
          path,
          originalError: String(error)
        })
      })

      // Fallback to temp directory
      const fallbackWrite = primaryWrite.pipe(
        Effect.catchTag("FileSystemError", (error) =>
          Effect.gen(function*() {
            yield* effectLogging.logError(error, {
              operation: "fileWrite",
              usingFallback: true
            })

            const tempPath = `/tmp/${basename(path)}`
            yield* Effect.tryPromise({
              try: () => fs.writeFile(tempPath, content),
              catch: (error) => new FileSystemError({
                message: `Fallback write failed for ${tempPath}`,
                operation: "write",
                path: tempPath,
                originalError: String(error)
              })
            })

            yield* effectLogging.logWithContext("info",
              `Fallback write succeeded to ${tempPath}`,
              { originalPath: path, fallbackPath: tempPath }
            )
          })
        )
      )

      yield* railwayErrorRecovery.retryWithBackoff(fallbackWrite, 3, 100, 1000)
    }),

  // Graceful compilation with multiple attempts
  resilientCompilation: (program: any) =>
    railwayErrorRecovery.gracefulDegrade(
      compileWithTypedErrors(program),
      { warnings: [], errors: [] }, // fallback empty result
      "Compilation failed, using empty result"
    ),

  // Batch processing with partial failure tolerance
  batchProcessTyped: <A, E>(
    items: Array<A>,
    processor: (item: A) => Effect.Effect<any, E>,
    successThreshold: number = 0.8
  ): Effect.Effect<{successes: any[], failures: E[]}, never> =>
    railwayErrorRecovery.partialFailureHandling(
      items.map(item => processor(item)),
      successThreshold
    )
};
```

**VERIFICATION:** Recovery patterns work under simulated failure conditions

**COMMIT:** "feat: Implement comprehensive error recovery and resilience patterns"

---

## 🎯 **VERIFICATION & QUALITY GATES**

### **After Each Step:**

1. **Build Verification**: `just build` passes with 0 TypeScript errors
2. **Lint Verification**: `just lint` passes with no new issues
3. **Test Verification**: Related tests pass, no regressions
4. **Type Safety**: Effect.catchTags patterns compile correctly
5. **Git Commit**: Small, focused commit with descriptive message

### **Final Verification (After All Steps):**

- **Test Success Rate**: Target 85%+ from current 57%
- **Error Coverage**: 90%+ error handling through Effect.TS
- **Type Safety**: Eliminate all anti-patterns and impossible states
- **Performance**: <5% overhead from enhanced error handling
- **Documentation**: All new error patterns documented

---

## 🚀 **EXECUTION SEQUENCE & SESSION BREAKS**

**Session 1 (2 hours):** Steps 1-3 - Critical infrastructure to unblock development
**Session 2 (2 hours):** Steps 4-6 - System-wide enhancement and developer experience  
**Session 3 (1.5 hours):** Steps 7-9 - Production-grade resilience and TypeSpec integration

Each session can be executed independently with clear stopping points and verification criteria.

---

**Ready for execution** ✅ - This research-backed plan provides a systematic approach to achieving Effect.TS error handling excellence while maintaining system stability and delivering immediate value.
