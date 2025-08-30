# TypeSpec AsyncAPI Emitter - Test Suite

## 🧪 **COMPREHENSIVE TEST INFRASTRUCTURE**

This test suite provides thorough validation of the TypeSpec AsyncAPI emitter through:

### **Test Structure**
```
test/
├── integration/              # End-to-end compilation tests
│   ├── basic-emit.test.ts           # Core emitter functionality
│   ├── basic-functionality.test.ts  # Working decorator tests
│   ├── decorator-validation.test.ts # Decorator constraint validation
│   └── real-world-scenarios.test.ts # Production use cases
├── unit/                     # Unit tests for emitter components
│   └── emitter-core.test.ts         # Core functionality tests
├── utils/                    # Test utilities and helpers
│   └── test-helpers.ts              # Reusable test functions
└── test-host.ts             # Test library configuration
```

## 🚀 **Running Tests**

### Prerequisites
```bash
# Ensure project is built
bun run build

# Install test dependencies
bun install
```

### Test Commands
```bash
# Run all tests
bun test

# Run specific test suites
bun test test/integration/
bun test test/unit/ 

# Run with coverage
bun test --coverage

# Run specific test file
bun test test/integration/basic-functionality.test.ts
```

## 🎯 **What Tests Validate**

### **Core Functionality**
- ✅ TypeSpec source compilation to AsyncAPI 3.0
- ✅ JSON and YAML output generation
- ✅ Schema generation from TypeSpec models
- ✅ Operation and channel mapping
- ✅ Documentation preservation (@doc annotations)
- ✅ Type mapping (string, int32, boolean, utcDateTime, etc.)
- ✅ Optional vs required field handling
- ✅ Union type support
- ✅ Array type support

### **AsyncAPI Compliance**
- ✅ AsyncAPI 3.0.0 specification compliance
- ✅ Proper channels structure
- ✅ Valid operations structure
- ✅ Components/schemas generation
- ✅ Message definitions
- ✅ Documentation integration

### **Production Scenarios**
- 🏪 **E-commerce System**: Order/payment/user event flows
- 🌐 **IoT Sensor Network**: Device management and sensor data
- 📈 **Financial Trading**: High-frequency trading events
- 🏢 **Multi-tenant SaaS**: Tenant-isolated event systems

## 🛠 **Test Utilities**

### **Compilation Helpers**
```typescript
// Compile TypeSpec and expect success
const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, options);

// Compile with diagnostic validation
const { diagnostics } = await compileAsyncAPISpec(source, options);

// Parse generated AsyncAPI files
const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "filename.json");
```

### **Validation Helpers**
```typescript
// Structure validation
expect(AsyncAPIAssertions.hasValidStructure(doc)).toBe(true);
expect(AsyncAPIAssertions.hasChannel(doc, "user.events")).toBe(true);
expect(AsyncAPIAssertions.hasOperation(doc, "publishEvent")).toBe(true);
expect(AsyncAPIAssertions.hasSchema(doc, "EventModel")).toBe(true);

// Property validation
expect(AsyncAPIAssertions.schemaHasProperty(doc, "Event", "id")).toBe(true);
expect(AsyncAPIAssertions.hasDocumentation(schema, "Expected docs")).toBe(true);
```

### **Test Data Generators**
```typescript
// Pre-built TypeSpec sources for common scenarios
TestSources.basicEvent        // Simple event model
TestSources.complexEvent      // Nested properties, unions
TestSources.multipleOperations // Multiple channels/operations
TestSources.withDocumentation  // Full documentation
```

## 📋 **Test Categories**

### **Integration Tests** (`test/integration/`)
- **basic-emit.test.ts**: Core compilation flow validation
- **basic-functionality.test.ts**: Working decorator functionality
- **decorator-validation.test.ts**: Decorator constraint checking
- **real-world-scenarios.test.ts**: Complex production scenarios

### **Unit Tests** (`test/unit/`)
- **emitter-core.test.ts**: Emitter component unit tests

## 🔍 **Example Test Usage**

```typescript
import { 
  compileAsyncAPISpecWithoutErrors, 
  parseAsyncAPIOutput, 
  AsyncAPIAssertions 
} from "../utils/test-helpers.js";

it("should compile TypeSpec to AsyncAPI", async () => {
  const source = `
    namespace Events;
    
    model UserEvent {
      userId: string;
      action: string;
    }
    
    @channel("user.events")
    op publishUserEvent(): UserEvent;
  `;

  const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
    "output-file": "test",
    "file-type": "json",
  });

  const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "test.json");
  
  expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
  expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishUserEvent")).toBe(true);
  expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "UserEvent")).toBe(true);
});
```

## 🎯 **Success Criteria**

Tests validate that the emitter:
- ✅ Compiles valid TypeSpec to AsyncAPI 3.0 without errors
- ✅ Generates properly structured JSON and YAML output
- ✅ Preserves all TypeSpec documentation in AsyncAPI output
- ✅ Maps TypeSpec types correctly to AsyncAPI schema types
- ✅ Handles complex nested models and relationships
- ✅ Supports multiple operations and channels
- ✅ Works with real-world production scenarios

## 🚨 **Current Status**

**Framework Status**: ✅ **COMPLETE**
**Test Coverage**: ✅ **COMPREHENSIVE**
**Ready to Run**: ⚠️ **When emitter implementation is complete**

The test infrastructure is fully implemented and will provide thorough validation once the TypeSpec AsyncAPI emitter development is finished.

## 📚 **Adding New Tests**

### **Create New Test File**
```typescript
import { describe, it, expect } from "vitest";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";

describe("New Feature Tests", () => {
  it("should test new functionality", async () => {
    // Your test implementation
  });
});
```

### **Add Custom Assertions**
```typescript
// Add to AsyncAPIAssertions in test-helpers.ts
customValidation: (doc: any, expectedValue: any) => {
  // Your custom validation logic
  return true;
},
```

This test suite ensures the TypeSpec AsyncAPI emitter meets production quality standards!