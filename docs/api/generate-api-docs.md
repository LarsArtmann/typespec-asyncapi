# API Documentation Generation System

This system automatically generates comprehensive API documentation from TypeScript source code and TypeSpec decorators.

## Documentation Architecture

### 1. TypeScript API Documentation
- **Tool**: TypeDoc for TypeScript source code documentation
- **Output**: HTML documentation with interactive navigation
- **Sources**: `src/` directory with comprehensive JSDoc comments

### 2. TypeSpec Decorator Documentation  
- **Source**: `lib/main.tsp` decorator definitions
- **Output**: Markdown documentation for decorator usage
- **Integration**: Examples linked to generated API docs

### 3. Plugin API Documentation
- **Focus**: Plugin development interfaces and examples
- **Integration**: Links to implementation examples in `src/plugins/`

## Generate API Documentation

```bash
# Install TypeDoc if not present
bun add -D typedoc

# Generate API documentation
just generate-api-docs

# View documentation
open docs/api/html/index.html
```

## Documentation Structure

```
docs/
├── api/
│   ├── html/                 # Generated TypeDoc HTML docs
│   │   ├── index.html
│   │   ├── modules/
│   │   └── classes/
│   ├── decorator-reference.md # TypeSpec decorators
│   ├── plugin-api.md         # Plugin development API
│   └── examples/             # Code examples
│       ├── basic-usage.md
│       ├── plugin-development.md
│       └── advanced-patterns.md
```

## API Documentation Standards

### 1. TypeScript Documentation Standards
All public APIs must include comprehensive JSDoc comments:

```typescript
/**
 * Generates AsyncAPI 3.0 specification from TypeSpec program
 * 
 * @param context - TypeSpec emission context with options and program
 * @returns Promise that resolves when AsyncAPI files are generated
 * @throws {EmitterInitializationError} When emitter setup fails
 * @throws {SpecGenerationError} When AsyncAPI generation fails
 * @throws {ValidationError} When generated spec is invalid
 * 
 * @example
 * ```typescript
 * // Generate AsyncAPI from TypeSpec context
 * await generateAsyncAPIWithEffect(context);
 * ```
 * 
 * @public
 */
export async function generateAsyncAPIWithEffect(
  context: EmitContext<AsyncAPIEmitterOptions>
): Promise<void>
```

### 2. Plugin API Documentation
Plugin interfaces must be fully documented:

```typescript
/**
 * Protocol plugin interface for AsyncAPI binding generation
 * 
 * Plugins implement protocol-specific logic for generating AsyncAPI 3.0
 * protocol bindings following the AsyncAPI binding specifications.
 * 
 * @example
 * ```typescript
 * export const customPlugin: ProtocolPlugin = {
 *   name: "custom-protocol",
 *   version: "1.0.0",
 *   generateOperationBinding: (operation) => Effect.succeed({ custom: {} })
 * };
 * ```
 */
export interface ProtocolPlugin {
  /** Protocol name matching AsyncAPIProtocolType */
  readonly name: AsyncAPIProtocolType;
  
  /** Plugin version for compatibility tracking */
  readonly version: string;
  
  /**
   * Generate protocol-specific operation bindings
   * @param operation - TypeSpec operation to process
   * @returns Effect containing protocol bindings or error
   */
  generateOperationBinding?: (
    operation: unknown
  ) => Effect.Effect<Record<string, unknown>, Error>;
}
```

## Documentation Quality Standards

### 1. Coverage Requirements
- **100% public API coverage**: All exported functions, classes, and types
- **Examples required**: Every public API must include usage examples
- **Error documentation**: All possible errors and exceptions documented

### 2. Code Examples
- **Working examples**: All examples must be tested and functional
- **Real-world usage**: Examples should reflect actual use cases
- **Copy-pasteable**: Examples should work without modification

### 3. Cross-References
- **Internal linking**: Related APIs should be cross-referenced
- **External links**: Link to AsyncAPI spec, TypeSpec docs, Effect.TS docs
- **Source links**: Link to implementation source code

## Automation Integration

The API documentation generation is integrated into the build process:

```bash
# Automatically generate docs during quality checks
just quality-check

# Update docs during releases
just release-alpha
```

## Maintenance Guidelines

### 1. Keep Documentation Current
- Update docs immediately when API changes
- Review documentation during code reviews
- Validate examples during testing

### 2. Documentation Review Process
- Documentation changes require review
- Examples must be tested before merge
- Breaking changes must update all affected docs

### 3. User Feedback Integration
- Monitor documentation usage analytics
- Collect user feedback on clarity and completeness
- Regular documentation usability testing

This system ensures comprehensive, accurate, and maintainable API documentation for the TypeSpec AsyncAPI Emitter.