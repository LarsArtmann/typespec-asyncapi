# PARTS.md - Component Analysis & Extraction Opportunities

**Last Updated:** 2026-02-28
**Version:** 1.0

---

## Overview

This document analyzes the TypeSpec AsyncAPI Emitter project to identify:
1. Existing components that could be extracted as standalone reusable libraries/SDKs
2. Alternative projects in each space and how our abstractions could provide more value
3. Strategic recommendations for library extraction

---

## Executive Summary

| Component | Extraction Priority | Value | Effort | Recommendation |
|-----------|--------------------| ----- | ------ | -------------- |
| TypeSpec Decorator Framework | HIGH | HIGH | LOW | Extract immediately |
| AsyncAPI Domain Types | HIGH | MEDIUM | LOW | Extract as separate package |
| Path Template Utilities | MEDIUM | MEDIUM | LOW | Extract to utility package |
| Protocol Binding Registry | MEDIUM | HIGH | MEDIUM | Extract after stabilization |
| Plugin System | LOW | HIGH | HIGH | Mature first, then extract |
| AsyncAPI Validator | LOW | MEDIUM | MEDIUM | Consider contributing to asyncapi org |

---

## Component Analysis

### 1. TypeSpec Decorator Framework

**Location:** `src/minimal-decorators.ts`, `src/decorators.ts`, `lib/main.tsp`

**Current State:**
- Decorator implementations for AsyncAPI concepts (@channel, @publish, @subscribe, @message, @protocol, @security, @server)
- State management utilities for storing decorator data
- Diagnostic reporting helpers
- Validation utilities

**Extraction Value:** HIGH

**Proposed Package:** `@lars-artmann/typespec-decorator-utils`

**What It Would Contain:**
```typescript
// Core utilities for TypeSpec decorator development
export function reportDecoratorDiagnostic(context, code, target, message, severity)
export function validateConfig(config, context, target, diagnosticCode, errorMessage)
export function createStoreState<T>(program, symbol)
export function getStateMap<T>(program, symbol)

// Decorator factory patterns
export function createTypedDecorator<TConfig>(options: DecoratorOptions<TConfig>)
export function createModelDecorator<TConfig>(options: ModelDecoratorOptions<TConfig>)
export function createOperationDecorator<TConfig>(options: OperationDecoratorOptions<TConfig>)
```

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `@typespec/compiler` | Built-in decorator utilities | Low-level, no patterns |
| TypeSpec HTTP library | Reference implementation | Tied to HTTP, not reusable |

**Our Value Add:**
- Higher-level abstraction over TypeSpec's low-level decorator API
- Reusable patterns for validation, state management, diagnostics
- Works across any TypeSpec library (not just AsyncAPI)
- Reduces boilerplate by 60-80% for new TypeSpec libraries

---

### 2. AsyncAPI Domain Types

**Location:** `src/types/minimal-domain-types.ts`, `src/state.ts`

**Current State:**
- Branded types for type safety (ChannelPath, MessageId, SchemaName)
- Configuration interfaces (ChannelConfig, MessageConfig, ServerConfigData)
- AsyncAPI document types
- State data interfaces

**Extraction Value:** MEDIUM-HIGH

**Proposed Package:** `@lars-artmann/asyncapi-types`

**What It Would Contain:**
```typescript
// Branded types for compile-time safety
export type ChannelPath = Brand<"ChannelPath", string>
export type MessageId = Brand<"MessageId", string>
export type SchemaName = Brand<"SchemaName", string>

// AsyncAPI 3.0 types
export interface AsyncAPIDocument { ... }
export interface AsyncAPIChannel { ... }
export interface AsyncAPIMessage { ... }
export interface AsyncAPIServer { ... }

// Protocol-specific types
export interface KafkaBinding { ... }
export interface MQTTBinding { ... }
export interface WebSocketBinding { ... }

// Validation schemas
export const AsyncAPIDocumentSchema = Schema.Struct({ ... })
```

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `@asyncapi/specs` | JSON Schemas for AsyncAPI | Runtime validation only, no TypeScript types |
| `asyncapi-validator` | Runtime validation | No compile-time safety |
| Hand-written types | Common approach | No branded types, no validation |

**Our Value Add:**
- Branded types prevent mixing up IDs (ChannelPath vs MessageId)
- Effect.Schema integration for runtime + compile-time validation
- Protocol-specific bindings with proper typing
- Zero-dependency option (just types) or full validation

---

### 3. Path Template Utilities

**Location:** `src/domain/models/path-templates.ts`

**Current State:**
- Path template parsing (`parsePathTemplate`)
- TypeSpec to AsyncAPI address conversion
- Parameter extraction
- Validation and normalization

**Extraction Value:** MEDIUM

**Proposed Package:** `@lars-artmann/path-template-utils`

**What It Would Contain:**
```typescript
// Parsing and conversion
export function parsePathTemplate(path: string): PathTemplate
export function convertToAsyncAPIAddress(template: PathTemplate): string
export function extractParameters(path: string): PathParameter[]

// Validation
export function validatePathTemplate(path: string): boolean
export function normalizePathTemplate(path: string): string

// Utilities
export function pathToChannelName(path: string): string
export function interpolatePath(template: string, params: Record<string, string>): string
```

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `path-to-regexp` | Express-style paths | HTTP-focused, different syntax |
| `uri-template` | RFC 6570 templates | Different syntax, overkill |
| OpenAPI path utils | Common ecosystem | Different conventions |

**Our Value Add:**
- TypeSpec-specific path syntax support (`{param:type}`)
- AsyncAPI channel address conventions
- Lightweight, zero dependencies
- Works with both TypeSpec and AsyncAPI ecosystems

---

### 4. Protocol Binding Registry

**Location:** `src/domain/decorators/`, `src/types/minimal-domain-types.ts`

**Current State:**
- Protocol configuration types (Kafka, MQTT, WebSocket, HTTP, AMQP)
- Protocol-specific defaults
- Binding validation

**Extraction Value:** MEDIUM-HIGH

**Proposed Package:** `@lars-artmann/asyncapi-protocol-bindings`

**What It Would Contain:**
```typescript
// Protocol registry
export const ProtocolRegistry = {
  kafka: KafkaProtocolHandler,
  mqtt: MQTTProtocolHandler,
  ws: WebSocketProtocolHandler,
  http: HTTPProtocolHandler,
  amqp: AMQPProtocolHandler,
  nats: NATSProtocolHandler,
  redis: RedisProtocolHandler,
}

// Per-protocol types and defaults
export interface KafkaProtocolConfig {
  partitions?: number
  replicationFactor?: number
  consumerGroup?: string
  sasl?: SASLConfig
}

export const KafkaDefaults = {
  partitions: 1,
  replicationFactor: 1,
  consumerGroup: "default",
}

// Validation per protocol
export function validateKafkaConfig(config: unknown): Result<KafkaProtocolConfig>
```

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `@asyncapi/bindings` | Official bindings spec | JSON Schema only, no TypeScript |
| Protocol-specific SDKs | Per-protocol | Fragmented, no unified interface |

**Our Value Add:**
- Unified TypeScript interface across all protocols
- Per-protocol defaults with type safety
- Validation with Effect.Schema
- Extensible registry pattern for custom protocols

---

### 5. Plugin System

**Location:** `src/plugins/core/PluginSystem.ts`

**Current State:**
- Basic plugin interface
- Plugin registry with Effect.TS integration
- Initialize/start/stop lifecycle

**Extraction Value:** LOW (for now)

**Proposed Package:** `@lars-artmann/effect-plugin-system`

**What It Would Contain:**
```typescript
// Plugin interface
export interface Plugin {
  readonly name: string
  readonly version: string
  readonly initialize: () => Effect.Effect<void, never>
}

// Registry
export class PluginRegistry {
  register(plugin: Plugin): Effect.Effect<void, never>
  get(name: string): Plugin | undefined
  getAll(): Plugin[]
  clear(): Effect.Effect<void, never>
}

// Lifecycle management
export interface PluginLifecycle {
  onStart: () => Effect.Effect<void, Error>
  onStop: () => Effect.Effect<void, Error>
  onHealthCheck: () => Effect.Effect<void, Error>
}
```

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `@effect/platform` | Effect platform services | No plugin pattern |
| `plugable` | Generic plugin system | Not Effect-native |
| InversifyJS | DI container | Different paradigm |

**Our Value Add:**
- Native Effect.TS integration
- Railway-oriented error handling
- Type-safe plugin interfaces
- Works with Effect's dependency injection

**Recommendation:** Mature within this project first, then extract once patterns are proven.

---

### 6. AsyncAPI Validator

**Location:** Test utilities, `@asyncapi/parser` integration

**Current State:**
- Integration with `@asyncapi/parser`
- Schema validation
- Spec compliance checking

**Extraction Value:** LOW-MEDIUM

**Proposed Contribution:** Consider contributing to `@asyncapi/parser` instead

**Alternatives:**
| Project | Description | Gap |
|---------|-------------|-----|
| `@asyncapi/parser` | Official parser | Good, could use enhancements |
| `asyncapi-validator` | Community package | Maintenance concerns |
| AJV + JSON Schema | DIY approach | Boilerplate |

**Recommendation:** Contribute improvements upstream rather than creating competing package.

---

## Strategic Recommendations

### Phase 1: Immediate Extraction (This Month)

1. **Extract `@lars-artmann/typespec-decorator-utils`**
   - Lowest risk, highest value
   - Enables other TypeSpec library development
   - ~200 lines of code, well-tested

2. **Extract `@lars-artmann/asyncapi-types`**
   - Low risk, enables reuse across projects
   - Benefits any AsyncAPI TypeScript project
   - ~150 lines of types

### Phase 2: Short-Term (Next Quarter)

3. **Extract `@lars-artmann/path-template-utils`**
   - General utility, not TypeSpec-specific
   - Could benefit OpenAPI/AsyncAPI ecosystem

4. **Extract `@lars-artmann/asyncapi-protocol-bindings`**
   - High value for event-driven developers
   - Needs more maturation in this project first

### Phase 3: Long-Term (6+ Months)

5. **Consider `@lars-artmann/effect-plugin-system`**
   - Only after proving in production
   - Could become broader Effect ecosystem contribution

---

## Library Policy Compliance

Per `HOW_TO_GOLANG.md` principles (adapted for TypeScript):

### Quality Gates for Extraction

- [ ] TypeScript strict mode with 0 errors
- [ ] Test coverage >90%
- [ ] ESLint compliance (0 errors)
- [ ] Documentation with examples
- [ ] Zero `any` types
- [ ] Proper branded types where applicable
- [ ] Effect.Schema integration for validation
- [ ] README with getting started guide

### Naming Conventions

- Package names: `@lars-artmann/<descriptive-name>`
- Follow npm ecosystem conventions
- Avoid "asyncapi-" prefix unless AsyncAPI-specific

### Dependencies

- Minimize external dependencies
- Use `effect` for functional patterns
- Use `@effect/schema` for validation
- Peer dependencies for optional integrations

---

## Alternative Project Ecosystem

### AsyncAPI Ecosystem

| Project | Purpose | Relationship |
|---------|---------|--------------|
| `@asyncapi/parser` | Parse AsyncAPI specs | We use for validation |
| `@asyncapi/specs` | JSON Schemas | We could use for validation |
| `@asyncapi/cli` | CLI tools | Complementary |
| `@asyncapi/java-spring-template` | Code generation | Different language |
| `@asyncapi/nodejs-template` | Code generation | Potential integration |

### TypeSpec Ecosystem

| Project | Purpose | Relationship |
|---------|---------|--------------|
| `@typespec/compiler` | Core compiler | Dependency |
| `@typespec/http` | HTTP library | Pattern reference |
| `@typespec/openapi3` | OpenAPI emitter | Parallel effort |
| `@typespec/rest` | REST library | Complementary |
| `@typespec/versioning` | Versioning | Optional peer |

### Our Unique Position

We bridge TypeSpec and AsyncAPI ecosystems:
- Type-safe API design with TypeSpec
- Event-driven API documentation with AsyncAPI
- Protocol-agnostic abstraction
- Code generation potential

---

## Implementation Checklist

### For Each Extracted Library

- [ ] Create new repository
- [ ] Set up TypeScript with strict config
- [ ] Add Effect.TS dependencies
- [ ] Port code with full test coverage
- [ ] Add comprehensive README
- [ ] Set up CI/CD
- [ ] Publish to npm
- [ ] Update this project to use extracted packages
- [ ] Document breaking changes

### Quality Metrics

- Bundle size <50KB for utility packages
- Type coverage 100%
- Documentation coverage >80%
- No circular dependencies
- Tree-shakeable exports

---

## Conclusion

The TypeSpec AsyncAPI Emitter contains several components with extraction potential. The highest-value extractions are:

1. **TypeSpec Decorator Utils** - Enables TypeScript library ecosystem
2. **AsyncAPI Types** - Benefits any AsyncAPI TypeScript project

Lower priority but valuable:

3. **Path Template Utils** - General purpose utility
4. **Protocol Bindings** - After more maturation

The plugin system should mature within this project before extraction consideration.

---

_Last Updated: 2026-02-28_
_Review Frequency: Quarterly or after major feature additions_
