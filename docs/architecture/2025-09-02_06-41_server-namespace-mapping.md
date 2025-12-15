# Server Namespace Mapping Architecture

**Date**: 2025-08-31  
**Status**: DESIGN DECISION  
**Impact**: Core AsyncAPI server generation functionality

## 🎯 Problem Statement

TypeSpec AsyncAPI emitter must resolve the architectural conflict between TypeSpec's namespace-scoped `@server`
decorators and AsyncAPI 3.0's document-level `servers` object.

### The Core Conflict

**TypeSpec Pattern:**

```typespec
@server("prod", {url: "wss://a.example.com", protocol: "websockets"})
namespace ServiceA {
}

@server("prod", {url: "wss://b.example.com", protocol: "websockets"})
namespace ServiceB {
}
```

**AsyncAPI 3.0 Expectation:**

```json
{
  "servers": {
    "server-name-1": {
      "host": "...",
      "protocol": "..."
    },
    "server-name-2": {
      "host": "...",
      "protocol": "..."
    }
  }
}
```

**The Problem:** Multiple namespaces can define servers with identical names, but AsyncAPI requires unique server
identifiers at the document level.

## 📊 Architecture Options Analysis

### Option A: Silent Overwrite (Last-Wins)

```json
// Result: Only ServiceB.prod survives
{
  "servers": {
    "prod": {
      "host": "b.example.com",
      "protocol": "websockets"
    }
  }
}
```

**Pros:**

- Simple implementation
- Clean server names in output

**Cons:**

- ❌ **Data Loss**: ServiceA server completely lost
- ❌ **Unpredictable**: Depends on namespace processing order
- ❌ **Silent Failure**: No warning about conflicts
- ❌ **NOT TypeSpec Philosophy**: Implicit, magical behavior

### Option B: Namespace-Qualified Names (RECOMMENDED)

```json
// Result: All servers preserved with clear attribution
{
  "servers": {
    "ServiceA.prod": {
      "host": "a.example.com",
      "protocol": "websockets"
    },
    "ServiceB.prod": {
      "host": "b.example.com",
      "protocol": "websockets"
    }
  }
}
```

**Pros:**

- ✅ **No Data Loss**: All servers preserved
- ✅ **Predictable**: Deterministic naming scheme
- ✅ **Clear Attribution**: Easy to trace server to source namespace
- ✅ **TypeSpec Philosophy**: Explicit, namespace-aware, type-safe

**Cons:**

- Longer server names in output
- Requires namespace name sanitization

### Option C: Conflict Detection with Error

```typescript
// Compilation fails with diagnostic error
@server(ServiceA, "prod", {...})
@server(ServiceB, "prod", {...}) // ERROR: Server name "prod" conflicts with ServiceA
```

**Pros:**

- Forces explicit user decisions
- No silent data loss

**Cons:**

- ❌ **Restrictive**: Prevents legitimate multi-service patterns
- ❌ **Poor UX**: Forces artificial server name variations
- ❌ **Breaks Composition**: Namespaces can't be independent

### Option D: Configuration-Driven Strategy

```typescript
// emitter-options.ts
export interface AsyncAPIEmitterOptions {
	serverNamingStrategy: "qualified" | "last-wins" | "error-on-conflict"
}
```

**Pros:**

- Flexible for different use cases
- User controls behavior

**Cons:**

- ❌ **Complex**: More configuration surface area
- ❌ **Inconsistent**: Different projects behave differently
- ❌ **Decision Paralysis**: Users must understand tradeoffs

## 🎯 DESIGN DECISION: Namespace-Qualified Names

**Chosen Approach:** Option B - Namespace-Qualified Server Names

### Rationale

This approach best aligns with **TypeSpec's core philosophy**:

#### 1. **Explicit Over Implicit**

- **TypeSpec Philosophy**: "No magic behavior, everything should be explicit"
- **Implementation**: Users can predict exactly what server name will be generated
- **Rejected Alternative**: Silent overwrites introduce magical, unpredictable behavior

#### 2. **Namespace-Aware Composition**

- **TypeSpec Philosophy**: "Respect namespace boundaries and enable composition"
- **Implementation**: Each namespace contributes servers with clear attribution
- **Rejected Alternative**: Flattening loses namespace context that user intended

#### 3. **Type-Safe and Predictable**

- **TypeSpec Philosophy**: "Compile-time predictability, no runtime surprises"
- **Implementation**: `NamespaceName.ServerName` format is deterministic
- **Rejected Alternative**: Conflict resolution introduces unpredictability

#### 4. **Standard Compliance**

- **TypeSpec Philosophy**: "Generate valid, standard-compliant output"
- **Implementation**: Valid AsyncAPI 3.0 servers object with meaningful names
- **Rejected Alternative**: Custom extensions break AsyncAPI compliance

## 🔧 Implementation Specification

### Core Algorithm

```typescript
function buildServersFromNamespaces(program: Program): Record<string, AsyncAPIServer> {
	const servers: Record<string, AsyncAPIServer> = {}

	// Iterate through all namespaces with server configurations
	for (const [namespace, serverConfigs] of program.stateMap($lib.stateKeys.serverConfigs)) {
		const namespaceName = getNamespaceName(namespace)

		// Process each server within the namespace
		for (const [serverName, config] of serverConfigs) {
			const qualifiedName = `${namespaceName}.${serverName}`
			servers[qualifiedName] = convertServerConfigToAsyncAPI(config)
		}
	}

	return servers
}

function getNamespaceName(namespace: Namespace): string {
	// Handle global namespace
	if (namespace.name === "" || !namespace.name) {
		return "Global"
	}

	// Sanitize namespace name for AsyncAPI compatibility
	return namespace.name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function convertServerConfigToAsyncAPI(config: ServerConfig): AsyncAPIServer {
	return {
		host: extractHostFromUrl(config.url),
		protocol: config.protocol,
		description: config.description,
		// Additional AsyncAPI server properties...
	}
}
```

### Naming Convention Rules

#### Qualified Name Format

```
{NamespaceName}.{ServerName}
```

#### Examples

```typespec
// TypeSpec Input → AsyncAPI Output

@server("production", {...})  // → "UserService.production"
@server("staging", {...})     // → "UserService.staging"
namespace UserService {

}

@server("production", {...}) // → "OrderService.production"
@server("development", {...})// → "OrderService.development"
namespace OrderService {
}

// Global namespace
@server("websocket", {...})          // → "Global.websocket"
namespace Global {}
```

#### Character Sanitization

```typescript
namespace "My-Service@v1" {
@server("My-Service@v1", "prod", {...})    // → "My_Service_v1.prod"
}
```

### Edge Cases Handling

#### Global Namespace Servers

```typescript
// Root level server (no explicit namespace)
@server(Global, "default", {...})           // → "Global.default"
```

#### Empty/Invalid Namespace Names

```typescript
namespace "" {
@server("", "server", {...})              // → "Global.server"
}
```

#### Duplicate Qualified Names (Should Not Occur)

```typescript
// This should be impossible but validate anyway
if (servers[qualifiedName]) {
	program.reportDiagnostic({
		code: "duplicate-server-qualified-name",
		messageId: "duplicateQualifiedServerName",
		target: serverDeclaration
	})
}
```

## 📈 User Experience Impact

### Predictable Output

Users can predict server names in generated AsyncAPI:

```typescript
// User writes:
namespace OrderService {
@server(OrderService, "production", {url: "wss://orders.api.com", protocol: "websockets"})
}

// User knows output will be:
// "servers": { "OrderService.production": {...} }
```

### Clear Service Attribution

Multi-service AsyncAPI documents have clear server ownership:

```json
{
  "servers": {
    "UserService.production": {
      ...
    },
    "UserService.staging": {
      ...
    },
    "OrderService.production": {
      ...
    },
    "PaymentService.production": {
      ...
    }
  }
}
```

### Tooling Benefits

- **Code Generation**: Server names clearly indicate service boundaries
- **Documentation**: Easy to group servers by service
- **Debugging**: Clear trace from AsyncAPI back to TypeSpec source

## 🚨 Migration Considerations

### Breaking Change Impact

This is a **BREAKING CHANGE** for any existing users expecting flat server names.

**Mitigation Strategy:**

- Document the change clearly in release notes
- Provide migration guide with before/after examples
- Consider adding emitter option for backward compatibility (future enhancement)

### Backward Compatibility Option (Future)

```typescript
// Potential future enhancement
export interface AsyncAPIEmitterOptions {
	serverNaming: "qualified" | "legacy-flat" // Default: "qualified"
}
```

## 🎯 Success Metrics

### Functional Requirements

- [ ] All server configurations from all namespaces appear in AsyncAPI document
- [ ] No server configurations are lost due to name conflicts
- [ ] Server names are valid AsyncAPI 3.0 identifiers
- [ ] Generated servers section is deterministic and predictable

### Quality Requirements

- [ ] Clear documentation of naming convention
- [ ] Comprehensive test coverage for edge cases
- [ ] Proper error handling for invalid configurations
- [ ] Performance impact is negligible

## 📚 References

- **TypeSpec Philosophy**: https://typespec.io/docs/language-basics/namespaces
- **AsyncAPI 3.0 Server Object**: https://www.asyncapi.com/docs/reference/specification/v3.0.0#serverObject
- **TypeSpec Emitter Patterns**: https://typespec.io/docs/extending-typespec/emitters
- **Related Issue**: Microsoft TypeSpec Issue #2463

---

**Decision Status**: ✅ **APPROVED**  
**Implementation Priority**: 🔥 **CRITICAL** (Required for functional decorator processing)  
**Next Action**: Implement `buildServersFromNamespaces()` function in AsyncAPI emitter
