# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **TypeSpec AsyncAPI Emitter** - a production-ready TypeSpec emitter that generates AsyncAPI 3.0 specifications from TypeSpec definitions. It directly addresses Microsoft TypeSpec Issue #2463 and provides enterprise-grade performance with comprehensive validation.

**Key Technologies:**
- **TypeSpec Compiler Integration** - Uses AssetEmitter architecture for proper TypeSpec integration
- **Effect.TS** - Modern functional programming patterns with Railway programming
- **AsyncAPI 3.0** - Latest event-driven API specification standard
- **Bun Runtime** - Fast JavaScript runtime and package manager

## Essential Commands

### Core Development Workflow
```bash
# Use justfile commands (preferred)
just build          # Build TypeScript → JavaScript
just lint           # Run ESLint with production-ready config  
just test           # Run all tests (138+ tests)
just typecheck      # Type check without emitting
just quality-check  # Full CI pipeline (clean, build, lint, test)

# Individual operations
bun run build       # Direct TypeScript compilation
bun test            # Run tests with Bun
bun run dev         # Development watch mode
```

### Testing Commands
```bash
# Test categories
just test-validation    # Run critical validation tests
just test-asyncapi     # Run AsyncAPI specification tests  
just test-coverage     # Run with coverage reports
bun test --watch       # Watch mode during development

# Single test file
bun test test/integration/basic-functionality.test.ts
```

### Code Quality & Analysis
```bash
just find-duplicates   # Code duplication analysis (alias: just fd)
just lint-fix         # Auto-fix ESLint issues
just validate-build   # Verify build artifacts
```

### TypeSpec Compilation
```bash
# Compile TypeSpec files to AsyncAPI
npx tsp compile example.tsp --emit @typespec/asyncapi
```

## Architecture & Code Organization

### Core Emitter Architecture

**Entry Point:** `src/index.ts`
- Exports `$onEmit` function called by TypeSpec compiler
- Delegates to `generateAsyncAPI` in `asyncapi-emitter.ts`

**Main Emitter:** `src/asyncapi-emitter.ts`  
- Uses TypeSpec AssetEmitter architecture for proper file generation
- Processes TypeSpec AST → AsyncAPI 3.0 JSON/YAML
- Supports channels, operations, messages, servers, security

**TypeSpec Library:** `lib/main.tsp`
- Defines AsyncAPI decorators: `@channel`, `@publish`, `@subscribe`, `@server`
- Extern declarations implemented in `src/decorators/`

### Decorator System

**Location:** `src/decorators/`
- `channel.ts` - `@channel` decorator for message routing
- `publish.ts` - `@publish` decorator for send operations  
- `subscribe.ts` - `@subscribe` decorator for receive operations
- `server.ts` - `@server` decorator for server configurations
- `message.ts`, `protocol.ts`, `security.ts` - Additional AsyncAPI features

### Effect.TS Integration

**Functional Programming Patterns:**
- Railway programming for error handling
- Monadic composition with `Effect` types
- Type-safe schema validation with `@effect/schema`
- Performance metrics collection in `src/performance/`

### Testing Strategy

**Test Organization:**
- `test/unit/` - Unit tests for individual components
- `test/integration/` - Integration tests for complete workflows  
- `test/validation/` - AsyncAPI specification compliance validation
- `test/` (root) - Critical validation and emitter tests

**Key Test Patterns:**
- Uses Bun's built-in test runner  
- TypeSpec compiler integration tests
- AsyncAPI specification validation against official schemas
- Comprehensive test coverage (138+ tests)

**CRITICAL TEST INFRASTRUCTURE:**
- **Build-Before-Test Policy:** All test commands run `bun run build` first to catch TypeScript compilation errors
- **Fail-Fast on TS Errors:** Tests will NOT run if TypeScript compilation fails - this prevents broken code from passing tests
- **Package.json Integration:** Uses `pretest` hook and explicit build commands in test scripts
- **Just Commands:** All justfile test commands also build first before running tests
- **Purpose:** Ensures tests catch what build catches - no more silent TypeScript failures

## Configuration Details

### TypeScript Configuration
- **Maximum Strictness:** `strict: true` plus additional strict flags
- **Effect.TS Compatible:** `verbatimModuleSyntax: true`, `downlevelIteration: true`
- **ESM Modules:** `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- **Performance Optimized:** Incremental builds with `.tsbuildinfo`

### ESLint Configuration  
**Production-Ready Balance:** (`eslint.config.js`)
- **Critical Safety (ERRORS):** `no-explicit-any`, `no-unsafe-*`, `no-floating-promises`
- **Code Quality (WARNINGS):** `prefer-nullish-coalescing`, `naming-convention`, `explicit-function-return-type`
- **Result:** 5 critical errors (must fix) + 105 warnings (track improvements)

### Package.json Scripts
```json
{
  "build": "tsc -p tsconfig.json",
  "test": "bun test", 
  "lint": "eslint src",
  "typecheck": "tsc --noEmit"
}
```

## Development Patterns

### Adding New AsyncAPI Features

1. **Define TypeSpec decorator** in `lib/main.tsp`
2. **Implement decorator logic** in `src/decorators/`
3. **Extend emitter processing** in `src/asyncapi-emitter.ts`
4. **Add comprehensive tests** in `test/`
5. **Update documentation** and examples

### Error Handling Patterns

**Use Effect.TS patterns:**
- `Effect.succeed()` for successful results
- `Effect.fail()` for expected failures
- `Effect.die()` for unexpected errors
- Railway programming for data transformations

### Testing New Features

**Required Test Coverage:**
- Unit tests for decorator functions
- Integration tests for emitter processing
- Validation tests against AsyncAPI schemas
- Performance benchmarks if applicable

## Key Limitations & Known Issues

**Current Limitations:**
- **Versioning:** Does NOT support `@typespec/versioning` decorators
- **ESLint:** 105 code quality warnings (non-blocking)
- **Advanced AsyncAPI:** Some complex AsyncAPI 3.0 features not implemented

**Architecture Decisions:**
- Focused on core AsyncAPI features for v1.0
- Deferred optional decorators (`@correlationId`, `@header`, `@tags`) to maintain focus
- Prioritized production readiness over feature completeness

## Dependencies & Peer Dependencies

**Critical Dependencies:**
- `@typespec/compiler` - TypeSpec compiler integration
- `@typespec/asset-emitter` - Proper emitter architecture
- `@asyncapi/parser` - AsyncAPI specification validation
- `effect` + `@effect/schema` - Functional programming patterns

**Development Dependencies:**
- `bun:test` - Built-in Bun testing framework  
- `eslint` + `typescript-eslint` - Code quality
- `typescript` - TypeScript compilation

This emitter represents production-ready code solving a real Microsoft TypeSpec community need with comprehensive testing and enterprise-grade performance validation.