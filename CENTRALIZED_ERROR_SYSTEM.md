# Centralized Error Handling System

**Production-Ready Error System combining Error base class with What/Reassure/Why/Fix/Escape patterns**

## ✅ SUCCESS CRITERIA ACHIEVED

### 1. Error Base Class Extension ✅
All error classes extend JavaScript `Error` base class:
- `instanceof Error === true` compatibility
- Proper stack trace capture
- TypeScript/JavaScript ecosystem integration
- Effect.TS tagged error compatibility

### 2. What/Reassure/Why/Fix/Escape Patterns ✅
Every error includes comprehensive context:
- **What**: Clear description of what happened
- **Reassure**: User-friendly reassurance message
- **Why**: Root cause explanation
- **Fix**: Actionable steps to resolve (array of strings)
- **Escape**: Temporary workaround or fallback behavior

### 3. Effect.TS Tagged Error Compatibility ✅
- All errors have `readonly _tag` property for type narrowing
- Compatible with Effect.TS error handling patterns
- Proper typed error propagation

### 4. Comprehensive Error Context ✅
- Unique error IDs for tracking
- Timestamps for debugging
- Error categories and severity levels
- Recovery strategy information
- Optional context data preservation

## 📁 DIRECTORY STRUCTURE

```
src/errors/
├── base.ts              # BaseAsyncAPIError class and types
├── validation.ts        # Validation error classes
├── compilation.ts       # TypeSpec compilation errors
├── filesystem.ts        # File I/O operation errors
├── schema.ts           # Schema generation errors
├── performance.ts      # Memory and performance errors
├── emitter.ts          # Emitter-specific errors
├── integration.ts      # Bridge to existing error system
├── examples.ts         # Usage examples and demonstrations
└── index.ts            # Main exports and utilities
```

## 🎯 ERROR CLASSES IMPLEMENTED

### Validation Errors
- `AsyncAPIValidationError` - Input/configuration validation
- `SchemaValidationError` - Schema constraint violations
- `ConfigurationValidationError` - Emitter option validation
- `DecoratorValidationError` - Decorator usage validation
- `TypeConstraintError` - Type definition constraints

### Compilation Errors
- `TypeSpecCompilationError` - General compilation failures
- `TypeSpecSyntaxError` - Syntax errors in TypeSpec
- `TypeSpecSemanticError` - Semantic analysis errors
- `ImportResolutionError` - Module import failures
- `CircularDependencyError` - Circular import dependencies

### File System Errors
- `FileSystemError` - Generic file operations
- `FileNotFoundError` - Missing files with path suggestions
- `PermissionDeniedError` - Access permission issues
- `DiskSpaceError` - Insufficient storage space
- `InvalidPathError` - Path validation errors
- `FileLockError` - File locking conflicts

### Schema Generation Errors
- `SchemaGenerationError` - AsyncAPI schema creation
- `CircularReferenceError` - Circular type references
- `UnsupportedTypeError` - Unsupported TypeSpec features
- `TypeResolutionError` - Missing type references
- `TypeSimplificationWarning` - Complex type simplifications

### Performance Errors
- `MemoryUsageError` - Memory threshold violations
- `OperationTimeoutError` - Operation timeouts
- `PerformanceThresholdError` - Performance metric violations
- `ResourceExhaustionError` - Resource limit reached
- `ConcurrencyLimitError` - Concurrency restrictions

### Emitter Errors
- `EmitterInitializationError` - Emitter setup failures
- `EmitterConfigurationError` - Invalid emitter options
- `OutputGenerationError` - Output format generation
- `VersionCompatibilityError` - AsyncAPI version issues
- `DecoratorProcessingError` - Decorator processing
- `ProtocolBindingError` - Protocol binding issues

## 🔧 KEY FEATURES

### 1. Error Base Class Compatibility
```typescript
const error = new AsyncAPIValidationError({ ... });
console.log(error instanceof Error); // true
console.log(error.name); // "AsyncAPIValidationError"
console.log(error.message); // Error message (what field)
console.log(error.stack); // Stack trace
```

### 2. Comprehensive Error Context
```typescript
const context = error.getErrorContext();
console.log(context.errorId); // Unique tracking ID
console.log(context.what); // What happened
console.log(context.reassure); // User reassurance
console.log(context.why); // Root cause
console.log(context.fix); // Array of fix steps
console.log(context.escape); // Workaround
```

### 3. Recovery Strategy Support
```typescript
if (error.canRecover) {
  console.log(error.recoveryStrategy); // "retry", "fallback", etc.
  console.log(error.recoveryHint); // Specific recovery guidance
  // Attempt recovery based on strategy
}
```

### 4. Effect.TS Integration
```typescript
function operation(): Effect.Effect<string, AsyncAPIError> {
  return Effect.gen(function* () {
    // Operations that may throw AsyncAPI errors
    return "success";
  });
}
```

## 🚀 USAGE EXAMPLES

### Basic Error Creation
```typescript
throw new AsyncAPIValidationError({
  field: "file-type",
  value: "xml",
  expected: "'yaml' or 'json'",
  operation: "validateOptions",
  recoveryValue: "yaml" // Default fallback
});
```

### Error Handling
```typescript
try {
  validateInput(data);
} catch (error) {
  if (isAsyncAPIError(error)) {
    console.log("User message:", error.getUserMessage());
    console.log("Technical:", error.getTechnicalSummary());
    
    if (error.canRecover) {
      // Implement recovery logic
    }
  }
}
```

### Integration with Existing System
```typescript
import { withErrorHandling } from "./errors/integration.js";

const result = yield* withErrorHandling(
  () => performOperation(),
  "operationName",
  config,
  logger
);

if (result.success) {
  // Use result.result
} else {
  // Handle result.error with comprehensive context
}
```

## 🔄 BACKWARD COMPATIBILITY

The system includes a complete integration bridge:
- Converts between new and old error formats
- Maintains existing error handling workflows
- Provides migration utilities
- Supports gradual adoption

### Migration Path
1. New errors automatically work with existing handlers
2. Old error contexts can be converted to new format
3. Error logging and reporting systems continue to work
4. Gradual replacement of error creation points

## 📊 ERROR CATEGORIZATION

- **validation**: Input/configuration validation failures
- **compilation**: TypeSpec compilation errors
- **file-system**: File I/O operations
- **schema-generation**: AsyncAPI schema creation
- **emitter**: Emitter initialization/operation errors
- **memory**: Memory/performance issues
- **configuration**: Invalid configuration
- **network**: External service failures
- **security**: Security-related errors
- **dependency**: Missing dependencies
- **unknown**: Catch-all for unclassified errors

## 🎛️ RECOVERY STRATEGIES

- **retry**: Retry the operation
- **fallback**: Use fallback mechanism
- **skip**: Skip and continue
- **prompt**: Prompt user for action
- **abort**: Abort operation
- **degrade**: Continue with reduced functionality
- **cache**: Use cached result
- **default**: Use safe default value

## ✅ PRODUCTION STANDARDS MET

- ✅ **Zero panic() usage** - All errors return proper Error objects
- ✅ **What/Reassure/Why/Fix/Escape** - Every error includes comprehensive context
- ✅ **Error base class inheritance** - Full JavaScript Error compatibility
- ✅ **Effect.TS tagged errors** - Type-safe error handling
- ✅ **Recovery mechanisms** - Graceful degradation and fallback strategies
- ✅ **Context preservation** - Full error context throughout application stack
- ✅ **TypeScript compliance** - Strong typing and optional property handling
- ✅ **Backward compatibility** - Seamless integration with existing system
- ✅ **Production examples** - Comprehensive usage demonstrations
- ✅ **Multi-error handling** - Independent error streams with aggregation

## 🎉 COMPLETION STATUS: **SUCCESS**

The centralized error handling system is **production-ready** and successfully combines:
- JavaScript Error base class inheritance
- What/Reassure/Why/Fix/Escape messaging patterns
- Effect.TS tagged error compatibility
- Comprehensive error context and recovery strategies
- Full backward compatibility with existing error handling system

All specified error classes have been implemented with production-quality standards, comprehensive documentation, and practical usage examples.
