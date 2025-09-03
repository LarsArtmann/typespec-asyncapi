# TypeSpec AsyncAPI Emitter - Alpha v0.0.1 Release

**Release Date**: September 2, 2025  
**Status**: Alpha Release  
**Version**: 0.0.1-alpha.1

## 🎯 Alpha Release Overview

This is the **first Alpha release** of the TypeSpec AsyncAPI Emitter, addressing [Microsoft TypeSpec Issue #2463](https://github.com/microsoft/typespec/issues/2463). This release provides core functionality for generating AsyncAPI 3.0 specifications from TypeSpec definitions.

## ✅ INCLUDED Features (Alpha Scope)

### Core Functionality
- **✅ Basic TypeSpec Operations → AsyncAPI Channels/Operations**
  - Convert TypeSpec operations to AsyncAPI publish/subscribe patterns
  - Channel path mapping with parameter support
  - Message payload schema generation

- **✅ Message Payloads with Schema Generation**
  - TypeSpec models → AsyncAPI message schemas
  - Support for primitive types, objects, arrays, unions
  - JSON Schema generation with proper type mapping

- **✅ Core Decorators**
  - `@channel(path)` - Define channel paths for message routing
  - `@publish` - Mark operations as publishers (send messages)
  - `@subscribe` - Mark operations as subscribers (receive messages)

- **✅ Protocol Bindings (Basic)**
  - Kafka protocol binding support
  - WebSocket protocol binding support  
  - HTTP protocol binding support
  - MQTT protocol binding support

- **✅ JSON/YAML Output Generation**
  - AsyncAPI 3.0.0 compliant specifications
  - Both JSON and YAML output formats
  - Configurable output file naming

### Development Infrastructure
- **✅ TypeScript Strict Mode** - Zero compilation errors
- **✅ Build System** - Comprehensive build and test pipeline
- **✅ Basic Testing** - Core functionality test coverage
- **✅ ESLint Configuration** - Code quality enforcement

## ❌ EXCLUDED Features (Beta/v1.0 Roadmap)

### Advanced Decorators (Beta Release)
- `@correlationId` - Message correlation handling
- `@header` - Custom message headers
- `@tags` - Resource tagging
- `@bindings` - Advanced protocol-specific bindings
- `@server` - Server configuration (partially implemented)
- `@security` - Security schemes (partially implemented)
- `@message` - Rich message metadata (partially implemented)

### Advanced TypeSpec Features (v1.0)
- Complex union types and discriminated unions
- TypeSpec versioning support (`@typespec/versioning`)
- Advanced model inheritance patterns
- Custom scalar types and formats

### Enterprise Features (v1.0)
- Comprehensive error handling and validation
- Performance optimizations for large schemas
- Advanced protocol binding configurations
- Plugin system for custom extensions

## 🚀 Quick Start Guide

### Installation

```bash
# Install with bun (recommended)
bun add @lars-artmann/typespec-asyncapi

# Install TypeSpec compiler
bun add @typespec/compiler

# Or with npm
npm install @lars-artmann/typespec-asyncapi @typespec/compiler
```

### Basic Usage Example

Create a TypeSpec file (`example.tsp`):

```typespec
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace UserEvents;

// Define message payload
model UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
}

// Define channel and operations
@channel("user.created")
model UserCreatedChannel {
  payload: UserCreatedPayload;
}

@publish
op publishUserCreated(): UserCreatedChannel;

@subscribe
op subscribeToUserCreated(): UserCreatedChannel;
```

### Generate AsyncAPI Specification

```bash
# Compile TypeSpec to AsyncAPI
npx tsp compile example.tsp --emit @lars-artmann/typespec-asyncapi

# Output will be in: tsp-output/@lars-artmann/typespec-asyncapi/
```

## 🎯 Alpha Limitations & Known Issues

### Current Limitations

1. **Limited Decorator Support**
   - Only core decorators (`@channel`, `@publish`, `@subscribe`) are fully functional
   - Advanced decorators may not work as expected

2. **Basic Protocol Bindings**
   - Protocol bindings are basic implementations
   - Advanced binding configurations not supported

3. **TypeScript Compilation Required**
   - Must build TypeScript before running emitter
   - No watch mode for development

4. **Limited Error Handling**
   - Basic error reporting
   - May not handle edge cases gracefully

### Known Issues

1. **ESLint Warnings**
   - 105 code quality warnings present (non-blocking)
   - Does not affect functionality

2. **Memory Usage**
   - No optimization for large schemas
   - Memory usage not optimized

3. **Complex Models**
   - Complex inheritance may not generate correctly
   - Circular references not handled

## 🧪 Testing & Validation

### Validated Scenarios

✅ **Basic Message Generation**
- Simple TypeSpec models → AsyncAPI message schemas
- Primitive types and basic objects
- Array and optional properties

✅ **Channel Operations**  
- Publish/subscribe pattern generation
- Channel path mapping
- Basic parameter handling

✅ **Protocol Bindings**
- Kafka, WebSocket, HTTP, MQTT basics
- JSON/YAML output generation

### Testing Commands

```bash
# Run all tests
bun run test

# Run Alpha-specific validation
bun run alpha-release

# Build and validate
bun run build && bun run test
```

## 📋 Beta Release Roadmap (v0.2.0)

### High Priority Features
- **Advanced Decorators** - Full decorator system implementation
- **Enhanced Error Handling** - Comprehensive error reporting
- **Performance Optimizations** - Memory usage improvements
- **Complex Model Support** - Union types, inheritance, circular refs

### Development Infrastructure
- **GitHub Actions CI** - Automated testing and releases
- **NPM Publishing** - Automated package publishing
- **Documentation** - Comprehensive guides and examples

### Target Timeline
- **Beta Release**: Q4 2025
- **Release Candidate**: Q1 2026
- **v1.0.0**: Q2 2026

## 🚨 Important Notes for Alpha Users

### Production Readiness
- **NOT RECOMMENDED** for production use
- Alpha quality software with limitations
- API may change between Alpha and Beta

### Feedback & Issues
- Report issues on [GitHub Issues](https://github.com/LarsArtmann/typespec-asyncapi/issues)
- Tag issues with `alpha-feedback` label
- Include version information and minimal reproduction

### Migration Path
- Beta release will include migration guide
- Breaking changes expected between Alpha and Beta
- Follow releases for upgrade instructions

## 📞 Support & Community

### Getting Help
- [GitHub Discussions](https://github.com/LarsArtmann/typespec-asyncapi/discussions) - Q&A and support
- [Issues](https://github.com/LarsArtmann/typespec-asyncapi/issues) - Bug reports and feature requests
- [Documentation](README.md) - Comprehensive usage guide

### Contributing
- Contributions welcome for Beta release
- See [Contributing Guidelines](README.md#contributing)
- Focus areas: advanced decorators, error handling, performance

---

**🎉 Thank you for trying the Alpha release! Your feedback helps shape the future of TypeSpec AsyncAPI integration.**

*This Alpha represents the foundation for enterprise-grade AsyncAPI generation from TypeSpec. While limited in scope, it demonstrates the core value proposition and establishes the architecture for future enhancements.*