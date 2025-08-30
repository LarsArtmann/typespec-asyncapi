# Changelog

All notable changes to the TypeSpec AsyncAPI Emitter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1-alpha.1] - 2025-08-30

### Added
- Initial TypeSpec AsyncAPI 3.0 emitter implementation
- AssetEmitter architecture for proper TypeSpec integration
- Core AsyncAPI decorators: `@channel`, `@publish`, `@subscribe`, `@server`
- Essential Kafka protocol bindings with topic, partition, and consumer group support
- Real AsyncAPI parser validation using `@asyncapi/parser`
- Effect.TS functional programming patterns with Railway programming
- Comprehensive test suite with 138+ tests
- TypeScript strict typing with maximum safety settings
- Professional package.json configuration for npm publishing
- Production-ready build and development toolchain
- Essential protocol binding support (Kafka, WebSocket, HTTP, AMQP, MQTT, Redis)

### Changed
- Package name structure: Fixed invalid syntax for proper npm publishing
- Dependencies reorganization: Moved core packages to main dependencies
- Node.js requirement: Updated from 18.0.0 to 20.0.0 for TypeSpec compatibility
- ESLint compliance: Fixed all type safety errors (30 errors → 0 errors)

### Technical Details
- **Architecture**: AssetEmitter-based TypeSpec emitter with modern patterns
- **Validation**: Real AsyncAPI parser integration replacing mock validation
- **Performance**: Honest performance expectations based on actual test measurements
- **Quality**: Production-ready codebase with comprehensive validation and testing

### Known Limitations
- TypeSpec versioning decorators not yet supported (planned for future release)
- Some advanced AsyncAPI 3.0 features deferred to maintain focus
- ESLint naming convention warnings (16 warnings - non-blocking)

### Breaking Changes
- None (initial alpha release)

---

## [Unreleased]

### Planned Features
- TypeSpec versioning support (`@added`, `@removed`, `@renamedFrom`)
- Advanced Kafka features (Schema Registry, custom serialization)
- Complete AsyncAPI 3.0 feature coverage
- Performance optimizations and caching improvements