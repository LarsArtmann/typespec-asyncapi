# TypeSpec AsyncAPI Emitter - Alpha Quality

|||[![Build Status](https://img.shields.io/badge/Build-PASSING-green)](https://github.com/LarsArtmann/typespec-asyncapi)|[![TypeScript](https://img.shields.io/badge/TypeScript-0%20Errors-green)](https://www.typescriptlang.org/)|[![Tests](https://img.shields.io/badge/Tests-255%2F664%20Passing-yellow)](https://github.com/LarsArtmann/typespec-asyncapi)|[![Status](https://img.shields.io/badge/Status-Alpha%20Ready-yellow)](https://github.com/LarsArtmann/typespec-asyncapi)|
|||---|---|---|---|
|||[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)||

**TypeSpec-to-AsyncAPI 3.0 emitter with functional core infrastructure and active development.**

> **BRUTAL HONESTY:** Core functionality works for basic use cases, but advanced features and some infrastructure need work. Suitable for experimentation and basic projects.

---

## 📊 **CURRENT STATUS ANALYSIS (2025-12-02)**

### ✅ **WORKING SYSTEMS**
- **Build System:** ✅ FULLY OPERATIONAL - 0 TypeScript compilation errors
- **Core Decorators:** ✅ FUNCTIONAL - @channel, @publish, @subscribe working
- **Schema Validation:** ✅ OPERATIONAL - @effect/schema domain objects working
- **Documentation Tests:** ✅ PASSING - Core documentation and mapping tests working
- **Performance Benchmarks:** ✅ STABLE - Core performance tests passing
- **Effect Patterns:** ✅ WORKING - Effect.TS functional patterns operational
- **Justfile Commands:** ✅ FUNCTIONAL - All core commands (`just build`, `just test`) working

### 🔴 **BROKEN SYSTEMS**
- **State Management:** 🔴 CRITICAL - `program.stateMap` undefined causing crashes
- **Import Resolution:** 🔴 PARTIALLY BROKEN - Some module import issues in tests
- **Complex Protocol Tests:** 🔴 FAILING - Advanced protocol tests (Kafka, MQTT, etc.) broken
- **Real Emitter Tests:** 🔴 BROKEN - State consolidation failures in full integration tests
- **Advanced Features:** 🔴 DISABLED - Complex infrastructure files temporarily removed (5,745 lines)

### 📈 **ACTUAL TEST METRICS**
- **Pass Rate:** 255/664 tests passing (38.4%) - **Improving but needs work**
- **Build Status:** ✅ PERFECT - TypeScript compilation with 0 errors
- **Core Functionality:** ✅ WORKING - Basic AsyncAPI generation functional
- **Advanced Features:** 🔴 DISABLED - Complex protocols and advanced features not working

---

## 🚀 **WHAT ACTUALLY WORKS RIGHT NOW**

### **Basic TypeSpec to AsyncAPI Generation**

```typescript
// This WORKS:
using TypeSpec.AsyncAPI;

@channel("user/events")
@publish
op publishUserEvent(userId: string, eventType: string): void;

@channel("orders")
@subscribe  
op subscribeToOrders(): void;
```

```bash
# These commands WORK:
bun install
just build          # ✅ TypeScript compilation succeeds
bun test test/documentation/  # ✅ Core documentation tests pass
bunx tsp compile example.tsp --emit @lars-artmann/typespec-asyncapi
# ✅ Generates basic AsyncAPI 3.0 YAML files
```

### **Working Features**
- ✅ **@channel decorator** - Basic channel path definition
- ✅ **@publish decorator** - Send operations 
- ✅ **@subscribe decorator** - Receive operations
- ✅ **Basic AsyncAPI 3.0 structure** - Core spec generation
- ✅ **Schema validation** - Type-safe validation with @effect/schema
- ✅ **TypeScript compilation** - Zero compilation errors
- ✅ **Documentation examples** - Core examples work

---

## 🚨 **WHAT'S BROKEN RIGHT NOW**

### **Critical Issues (Block Advanced Usage)**

#### **State Management Failure**
```bash
# Current Error: 
TypeError: undefined is not an object (evaluating 'program.stateMap')
# Impact: Advanced state consolidation crashes
# Status: 🔴 CRITICAL - Blocks complex TypeSpec processing
```

#### **Complex Protocol Support**
```bash
# Status: Advanced protocol tests FAILING
# Kafka: 0/45 tests passing
# MQTT: 0/45 tests passing  
# WebSocket: 0/45 tests passing
# Impact: No enterprise protocol support
```

#### **Infrastructure Gaps**
```bash
# Problem: 5,745 lines of complex infrastructure disabled
# Files affected:
# - AsyncAPIEmitterCore.ts (360 lines)
# - PluginSystem.ts (1,254 lines)  
# - StateManager.ts + StateTransitions.ts (1,223 lines)
# - AdvancedTypeModels.ts (749 lines)
# Impact: No plugin system, no advanced state management
```

---

## 🛠️ **GETTING STARTED (What Actually Works)**

### **Installation**
```bash
# Install the emitter
bun add @lars-artmann/typespec-asyncapi

# OR clone for development
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
bun install
```

### **Basic Usage (WORKING)**
```typescript
// Create your TypeSpec file (api.tsp)
using TypeSpec.AsyncAPI;

@channel("user/events")
@publish  
op publishUserEvent(userId: string, eventType: string): void;

@channel("orders")
@subscribe
op subscribeToOrders(): void;
```

```bash
# Generate AsyncAPI (this WORKS)
bunx tsp compile api.tsp --emit @lars-artmann/typespec-asyncapi

# Output: asyncapi.yaml with basic channels and operations
```

### **Development Workflow**
```bash
just build          # ✅ Build TypeScript (0 errors)
just test           # ✅ Run tests (255/664 pass)
just lint           # ✅ ESLint validation
bun test --watch    # ✅ Watch mode for development
```

---

## 📋 **KNOWN WORKAROUNDS**

### **For State Management Issues**
```typescript
// Workaround: Use simple decorator patterns
@channel("simple/path")  // ✅ Works
// Avoid: Complex state-dependent decorators
```

### **For Protocol Limitations**
```typescript
// Workaround: Basic channel generation works
@channel("kafka.orders")  // ✅ Generates channel name
// Manual protocol binding in generated AsyncAPI needed
```

### **For Test Failures**
```bash
# Run only working test categories
bun test test/documentation/     # ✅ Core tests pass
bun test test/effect-patterns.test.ts  # ✅ Effect patterns work
bun test test/schema-integration.test.ts # ✅ Schema validation works

# Avoid broken tests for now
# Skip: test/protocols/ (complex protocols broken)
# Skip: test/validation/ (state management issues)
```

---

## 🎯 **REALISTIC ROADMAP**

### **PHASE 1: State Management Recovery (Next 1-2 weeks)**
**Priority: CRITICAL**

1. **Fix program.stateMap Access**
   - Debug TypeSpec compiler integration
   - Restore proper state extraction
   - Fix 40% of failing tests

2. **Basic Infrastructure Restoration**
   - Reactivate core state management files
   - Fix import resolution issues
   - Restore basic plugin functionality

3. **Core Feature Validation**
   - Ensure end-to-end basic generation works
   - Validate generated AsyncAPI specs
   - Fix critical integration tests

### **PHASE 2: Protocol Support (Next 3-4 weeks)**
**Priority: HIGH**

1. **Enterprise Protocol Recovery**
   - Restore Kafka protocol support
   - Restore MQTT protocol support  
   - Restore WebSocket protocol support
   - Fix 300+ failing protocol tests

2. **Advanced Decorator Support**
   - Reactivate complex infrastructure files
   - Restore @message, @server, @security decorators
   - Implement proper validation

### **PHASE 3: Production Readiness (Next 2-3 months)**
**Priority: MEDIUM**

1. **Quality Assurance**
   - Achieve >90% test pass rate
   - Performance optimization
   - Security validation

2. **Advanced Features**
   - Plugin system restoration
   - Custom protocol bindings
   - Enterprise-grade features

---

## 🏷️ **HONEST USAGE RECOMMENDATIONS**

### **✅ USE FOR:**
- **Experimentation** - Learning TypeSpec and AsyncAPI integration
- **Basic Projects** - Simple event-driven APIs with standard channels
- **Prototyping** - Quick AsyncAPI spec generation from TypeSpec
- **Contributions** - Core infrastructure is working and testable

### **❌ AVOID FOR:**
- **Production Systems** - State management issues too critical
- **Complex Protocols** - Kafka, MQTT, WebSocket support broken
- **Enterprise Features** - Plugin system, advanced security disabled
- **Mission-Critical APIs** - Insufficient validation and testing

---

## 🤝 **CONTRIBUTION STATUS**

### **WELCOMED CONTRIBUTIONS:**
- **Bug Fixes** - Core infrastructure issues
- **Documentation** - Examples and getting started guides
- **Test Improvements** - Core test suite reliability
- **Basic Features** - Simple decorator enhancements

### **DIFFICULT AREAS:**
- **State Management** - Requires TypeSpec compiler expertise
- **Protocol Support** - Complex infrastructure restoration needed
- **Plugin System** - 5,745 lines of complex code to restore

---

## 📊 **PROJECT METRICS**

### **Current State (December 2, 2025)**
- **Version:** 0.0.1 (Alpha)
- **Build Status:** ✅ Perfect (0 TypeScript errors)
- **Test Coverage:** 38.4% (255/664 passing)
- **Core Features:** ✅ Functional for basic use cases
- **Advanced Features:** 🔴 Disabled (infrastructure issues)
- **Production Ready:** ❌ Not yet (state management critical)

### **Quality Metrics**
- **TypeScript Compilation:** ✅ 0 errors (from 425 previously)
- **Code Duplication:** ✅ Excellent (0.47% - best in class)
- **ESLint Compliance:** ✅ 5 critical errors, 105 warnings
- **Dependencies:** ✅ Current and secure
- **Documentation:** ✅ Core examples working

---

## 📞 **SUPPORT & COMMUNICATION**

### **CURRENT REALITY**
- **Issues:** ✅ Open for core infrastructure bug reports
- **PRs:** ✅ Welcomed for basic functionality fixes
- **Support:** ⚠️ Limited - focus on infrastructure recovery
- **Documentation:** ✅ Core examples accurate and tested

### **GETTING HELP**
- **Basic Questions:** GitHub Discussions (working features)
- **Bug Reports:** GitHub Issues (with reproduction steps)
- **Complex Issues:** Check known limitations first
- **Feature Requests:** Welcome but timeline uncertain

---

## 🏷️ **STATUS SUMMARY**

**Status:** 🟡 Alpha Quality - Core Working, Advanced Broken  
**Usability:** ✅ Basic use cases functional  
**Production Ready:** ❌ State management issues critical  
**Contribution Ready:** ✅ Core infrastructure stable  

**This project provides functional TypeSpec-to-AsyncAPI generation for basic use cases, with significant limitations in advanced features and enterprise protocol support.**

---

*Last Honest Update: 2025-12-02*  
*Status: Alpha Quality - Basic functionality working, advanced features disabled*