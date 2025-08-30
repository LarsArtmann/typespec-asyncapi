# TypeSpec AsyncAPI Emitter

A native TypeSpec emitter for generating AsyncAPI 3.0 specifications from TypeSpec definitions.

## ⚠️ Current Limitations

**VERSIONING NOT SUPPORTED**: This emitter does not currently support TypeSpec.Versioning decorators (`@added`, `@removed`, `@renamedFrom`). It generates a single AsyncAPI document without version-aware processing.

See [GitHub Issue #1](https://github.com/LarsArtmann/typespec-asyncapi/issues/1) for planned versioning support.

## Installation

```bash
bun install
```

## Build Process

### Quick Start
```bash
# Install dependencies
bun install

# Build the project
just build

# Run full quality check
just quality-check
```

### Available Commands

**Build & Validation:**
```bash
just build          # Build with enhanced error handling and validation
just validate-build # Validate build artifacts
just typecheck      # Type check without emitting files
```

**Quality Assurance:**
```bash
just lint           # Run linting
just lint-fix       # Run linting with auto-fix
just test           # Run tests
just quality-check  # Complete quality pipeline
```

**Development:**
```bash
just dev            # Development workflow
just watch          # Watch mode for building
just test-watch     # Watch mode for tests
```

### Build Configuration

- **TypeScript 5.9.2** with strict mode enabled
- **Incremental compilation** for faster builds
- **Comprehensive error handling** with detailed reporting
- **Build artifact validation** ensuring quality output
- **Effect.TS compatibility** with proper module handling

## Usage

```bash
# After successful build
cd examples/basic-events
tsp compile .
```

## Development

This project uses Bun as the JavaScript runtime and package manager with a robust build pipeline ensuring production-ready compilation.
