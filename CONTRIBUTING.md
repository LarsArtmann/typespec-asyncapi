# Contributing to TypeSpec AsyncAPI Emitter

Thank you for your interest in contributing to the TypeSpec AsyncAPI Emitter! This project aims to become the definitive solution for generating AsyncAPI 3.0 specifications from TypeSpec definitions.

## 🎯 Project Mission

We're solving **[Microsoft TypeSpec Issue #2463](https://github.com/microsoft/typespec/issues/2463)** with a production-ready emitter that goes far beyond a simple POC. Our goal is to create a comprehensive, community-driven ecosystem for AsyncAPI generation.

## 🤝 Ways to Contribute

### 1. Code Contributions

- **Core emitter improvements** - Enhance the main TypeSpec processing pipeline
- **Plugin development** - Create new protocol bindings (MQTT, AMQP, Redis, etc.)
- **Performance optimization** - Improve memory usage and processing speed
- **Bug fixes** - Fix issues and edge cases
- **Test improvements** - Expand test coverage and add edge case testing

### 2. Documentation

- **User guides** - Improve getting-started and usage documentation
- **API documentation** - Enhance TypeScript API reference
- **Examples** - Create real-world usage examples
- **Tutorials** - Write step-by-step learning materials
- **Architecture docs** - Document design decisions and patterns

### 3. Community Support

- **Issue triage** - Help classify and reproduce bug reports
- **Code reviews** - Review pull requests and provide feedback
- **Questions** - Help answer questions in GitHub Discussions
- **Testing** - Test Alpha releases and provide feedback

### 4. Ecosystem Development

- **CI/CD templates** - Create deployment and automation templates
- **Cloud bindings** - Add support for AWS, GCP, Azure services

## 🚀 Getting Started

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/typespec-asyncapi
cd typespec-asyncapi

# 2. Install dependencies
bun install

# 3. Build the project
just build

# 4. Run tests
just test

# 5. Validate everything works
just quality-check
```

### Development Tools

We use a modern development stack:

- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Strict mode for maximum type safety
- **Effect.TS** - Functional programming with railway error handling
- **ESLint** - Code quality and consistency
- **Vitest/Bun** - Testing framework
- **Just** - Command runner for development tasks

### Project Structure

```
typespec-asyncapi/
├── src/                     # TypeScript source code
│   ├── decorators/          # TypeSpec decorator implementations
│   ├── plugins/             # Built-in protocol plugins
│   ├── performance/         # Performance monitoring
│   ├── validation/          # AsyncAPI validation
│   └── utils/               # Utility functions
├── lib/                     # TypeSpec library definition
├── test/                    # Test suites
├── docs/                    # Documentation
│   ├── architecture/        # ADRs and architecture docs
│   ├── guides/              # User guides
│   └── examples/            # Code examples
├── examples/                # Real-world examples
└── scripts/                 # Development and deployment scripts
```

## 📋 Contribution Process

### 1. Issue First

Before starting work, create or find a relevant GitHub issue:

- **Bug reports** - Describe the problem, steps to reproduce, and expected behavior
- **Feature requests** - Explain the use case, proposed solution, and acceptance criteria
- **Plugin requests** - Specify the protocol, binding specification, and community need

### 2. Discussion and Planning

For significant changes:

- Comment on the issue with your proposed approach
- Get feedback from maintainers and community
- Consider creating a design document for complex features

### 3. Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes
# - Follow TypeScript strict mode requirements
# - Add comprehensive tests
# - Update documentation
# - Follow Effect.TS patterns

# 3. Run quality checks
just quality-check

# 4. Commit with clear messages
git add .
git commit -m "feat(decorators): add @mqtt protocol support

- Implement MQTT protocol binding generation
- Add support for QoS levels and retention
- Include comprehensive test coverage
- Update documentation with examples"

# 5. Push and create pull request
git push origin feature/your-feature-name
# Create PR on GitHub
```

### 4. Pull Request Requirements

Your PR must include:

- ✅ **Comprehensive tests** - Unit tests for new functionality
- ✅ **Type safety** - TypeScript strict mode compliance
- ✅ **Documentation** - Updated docs for user-facing changes
- ✅ **Examples** - Usage examples for new features
- ✅ **Quality gates** - All ESLint checks pass (warnings acceptable)

### 5. Code Review Process

- **Automated checks** - GitHub Actions run tests and quality checks
- **Maintainer review** - Core maintainers review code and approach
- **Community feedback** - Community members may provide additional insights
- **Iteration** - Address feedback and iterate on the solution

## 🎨 Code Style and Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and Effect.TS patterns
export const processOperation = (operation: Operation): Effect.Effect<AsyncAPIOperation, Error> =>
  Effect.gen(function* () {
    const channelPath = yield* extractChannelPath(operation);
    const operationType = yield* determineOperationType(operation);

    return {
      action: operationType,
      channel: { $ref: `#/channels/${channelPath}` }
    };
  });

// ❌ Avoid: Any types and imperative error handling
export function processOperation(operation: any): any {
  try {
    const channelPath = getChannelPath(operation);
    return { action: "send", channel: channelPath };
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### Error Handling Patterns

```typescript
// ✅ Good: Effect.TS error handling
const validateConfig = (config: unknown): Effect.Effect<ProtocolConfig, ValidationError> =>
  Effect.gen(function* () {
    if (typeof config !== 'object') {
      return yield* Effect.fail(new ValidationError("Config must be object"));
    }

    const validConfig = yield* parseProtocolConfig(config);
    return validConfig;
  });

// ❌ Avoid: Throwing exceptions
function validateConfig(config: unknown): ProtocolConfig {
  if (typeof config !== 'object') {
    throw new Error("Config must be object");
  }
  return config as ProtocolConfig;
}
```

### Testing Standards

```typescript
// ✅ Comprehensive test with real scenarios
describe("Channel Decorator", () => {
  it("should process parameterized channel paths", async () => {
    const operation = createMockOperation("publishUserEvent");
    const channelPath = "user.{userId}.events";

    const result = await Effect.runPromise(
      processChannelDecorator(operation, channelPath)
    );

    expect(result.channelPath).toBe("user.{userId}.events");
    expect(result.parameters).toEqual(["userId"]);
  });

  it("should fail gracefully with invalid paths", async () => {
    const operation = createMockOperation("invalidOp");

    const result = await Effect.runPromise(
      Effect.either(processChannelDecorator(operation, ""))
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(ValidationError);
  });
});
```

## 🧪 Testing Guidelines

### Test Categories

1. **Unit Tests** (`test/unit/`) - Individual function and class testing
2. **Integration Tests** (`test/integration/`) - Component interaction testing
3. **Validation Tests** (`test/validation/`) - AsyncAPI spec compliance testing
4. **Performance Tests** (`test/performance/`) - Memory and speed validation

### Running Tests

```bash
# Run all tests
just test

# Run specific test categories
just test-validation
just test-asyncapi

# Run with coverage
just test-coverage

# Watch mode during development
bun test --watch
```

### Test Requirements

- **Comprehensive coverage** - All public APIs must be tested
- **Real scenarios** - Tests should reflect actual usage patterns
- **Error cases** - Test failure paths and edge cases
- **Performance validation** - Include performance assertions for critical paths

## 📚 Documentation Standards

### Code Documentation

All public APIs must include JSDoc comments:

````typescript
/**
 * Generates AsyncAPI 3.0 channel object from TypeSpec operation
 *
 * Processes TypeSpec operations decorated with @channel to create
 * AsyncAPI channel definitions with proper message routing.
 *
 * @param operation - TypeSpec operation with @channel decorator
 * @param channelPath - Channel path string (may include parameters)
 * @returns Effect containing AsyncAPI channel object or validation error
 *
 * @example
 * ```typescript
 * const channel = await Effect.runPromise(
 *   generateChannel(operation, "user.{userId}.events")
 * );
 * // { path: "user.{userId}.events", parameters: { userId: {...} } }
 *
 *
 * @public
 */
export const generateChannel = (
		operation: Operation,
		channelPath: string,
    ): Effect.Effect<AsyncAPIChannel, ValidationError>
````

### User Documentation

When adding user-facing features:

1. **Update getting-started guide** if it affects basic usage
2. **Add decorator reference** for new decorators
3. **Create examples** showing real-world usage
4. **Update README** if it's a major feature

## 🏗️ Plugin Development

Creating protocol plugins is a key way to contribute:

### Plugin Checklist

- ✅ **Follow AsyncAPI binding spec** - Implement official binding specifications
- ✅ **Comprehensive type definitions** - Full TypeScript types for all bindings
- ✅ **Effect.TS integration** - Use Effect patterns for error handling
- ✅ **Validation** - Implement configuration validation
- ✅ **Tests** - Unit and integration tests
- ✅ **Documentation** - Usage examples and API docs
- ✅ **Real-world examples** - Show practical usage patterns

### Plugin Template

See [Plugin Development Guide](docs/guides/plugin-development.md) for comprehensive examples and patterns.

## 🚨 Security Considerations

### Reporting Security Issues

- **Email maintainers** for sensitive security issues
- **Use GitHub Security Advisories** for coordinated disclosure
- **Don't publish** security issues in public issues

### Security Guidelines

- **Input validation** - Validate all user inputs and configurations
- **No secrets in code** - Use environment variables for sensitive data
- **Dependency auditing** - Regular security audits of dependencies
- **Safe defaults** - Secure-by-default configurations

## 🎯 Release Process

### Release Cycle

- **Alpha releases** - Feature development and testing
- **Beta releases** - Stability and performance improvements
- **Stable releases** - Production-ready features with full documentation

### Version Strategy

We follow semantic versioning:

- **Major** (1.0.0) - Breaking changes
- **Minor** (0.1.0) - New features, backward compatible
- **Patch** (0.1.1) - Bug fixes, backward compatible

## 🏆 Recognition

Contributors are recognized in:

- **GitHub Contributors** section
- **Release notes** acknowledgments
- **Documentation** author attribution
- **Community showcases** for significant contributions

### Contribution Types

- **Code** - Direct code contributions
- **Documentation** - Documentation improvements
- **Testing** - Bug reports and testing
- **Community** - Support and mentoring
- **Design** - UI/UX and design improvements

## 📞 Communication

### GitHub

- **Issues** - Bug reports and feature requests
- **Discussions** - Q&A, ideas, and community chat
- **Pull Requests** - Code review and collaboration

### Community Guidelines

- **Be respectful** - Treat all community members with respect
- **Be constructive** - Provide helpful feedback and suggestions
- **Be patient** - Contributors volunteer their time
- **Be inclusive** - Welcome diverse perspectives and backgrounds

### Getting Help

- **Documentation** - Check docs first
- **Search issues** - Look for existing solutions
- **Ask questions** - Use GitHub Discussions for help
- **Join community** - Connect with other contributors

## 🎉 Thank You

Every contribution, no matter how small, helps make the TypeSpec AsyncAPI Emitter better for everyone. Whether you're:

- Fixing a typo in documentation
- Adding a new protocol plugin
- Reporting a bug
- Answering questions in discussions
- Reviewing pull requests

**You're helping solve a real community need and advancing the AsyncAPI ecosystem!**

---

**Ready to contribute? Start by checking out [good first issues](https://github.com/LarsArtmann/typespec-asyncapi/labels/good%20first%20issue) and join the discussion!**

_This project is built by the community, for the community. Welcome aboard!_
