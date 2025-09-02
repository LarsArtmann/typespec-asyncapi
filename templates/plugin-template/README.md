# TypeSpec AsyncAPI Plugin Template

This template provides a starting point for creating custom TypeSpec AsyncAPI plugins that extend the emitter with cloud provider bindings, protocol support, or message transformations.

## Quick Start

1. **Clone this template**:
   ```bash
   git clone <template-repo-url> my-asyncapi-plugin
   cd my-asyncapi-plugin
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Customize your plugin**:
   - Edit `src/plugin.ts` with your plugin logic
   - Update `package.json` with your plugin details
   - Modify tests in `test/` directory

4. **Build and test**:
   ```bash
   bun run build
   bun test
   ```

5. **Register with marketplace**:
   ```bash
   plugin-cli register ./plugin.json
   ```

## Plugin Structure

```
my-asyncapi-plugin/
├── src/
│   ├── plugin.ts              # Main plugin implementation
│   ├── types.ts               # TypeScript type definitions
│   └── utils.ts               # Utility functions
├── test/
│   ├── plugin.test.ts         # Plugin unit tests
│   └── integration.test.ts    # Integration tests
├── docs/
│   ├── README.md             # Plugin documentation
│   └── examples.md           # Usage examples
├── templates/
│   └── typespec-examples/    # TypeSpec usage examples
├── package.json              # NPM package configuration
├── plugin.json               # Plugin marketplace metadata
├── tsconfig.json             # TypeScript configuration
└── vitest.config.ts          # Test configuration
```

## Plugin Types

### Cloud Provider Plugin

For cloud messaging services (AWS SNS/SQS, Google Pub/Sub, Azure Service Bus):

```typescript
export class MyCloudPlugin extends BaseCloudBindingPlugin {
  readonly bindingType = 'my-cloud-service'
  readonly name = 'My Cloud Service Plugin'
  readonly version = '1.0.0'
  readonly description = 'Integration with My Cloud messaging service'
  
  processBindings(
    context: DecoratorContext,
    target: Operation | Model,
    asyncApiDoc: AsyncAPIObject
  ): Effect.Effect<CloudBindingResult, Error> {
    // Implementation here
  }
}
```

### Protocol Plugin

For messaging protocols (MQTT, WebSocket, custom protocols):

```typescript
export class MyProtocolPlugin implements CloudBindingPlugin {
  readonly bindingType = 'my-protocol'
  // Implementation here
}
```

### Transformation Plugin

For message or document transformations:

```typescript
export class MyTransformPlugin implements CloudBindingPlugin {
  readonly bindingType = 'my-transform'
  
  transformDocument?(asyncApiDoc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error> {
    // Transform the AsyncAPI document
  }
}
```

## Configuration Schema

Define your plugin's configuration schema in `src/types.ts`:

```typescript
export interface MyPluginConfig extends CloudBindingConfig {
  // Required fields
  endpoint: string
  
  // Optional fields  
  timeout?: number
  retries?: number
  
  // Authentication
  auth?: {
    type: 'api-key' | 'oauth'
    credentials: Record<string, unknown>
  }
}
```

## Plugin Metadata

Update `plugin.json` with your plugin information:

```json
{
  "id": "my-asyncapi-plugin",
  "name": "My AsyncAPI Plugin", 
  "version": "1.0.0",
  "description": "Brief description of plugin functionality",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://yourwebsite.com"
  },
  "license": "MIT",
  "keywords": ["asyncapi", "messaging", "cloud"],
  "category": "cloud-provider",
  "maturity": "beta",
  "supportedAsyncApiVersions": ["3.0.0"],
  "typespecVersion": ">=0.50.0",
  "repository": "https://github.com/yourusername/my-asyncapi-plugin",
  "installation": {
    "package": "my-asyncapi-plugin",
    "command": "npm install my-asyncapi-plugin"
  }
}
```

## Testing Guidelines

### Unit Tests

Test individual plugin functions:

```typescript
import { describe, it, expect } from 'vitest'
import { MyCloudPlugin } from '../src/plugin.js'

describe('MyCloudPlugin', () => {
  const plugin = new MyCloudPlugin()
  
  it('should validate configuration correctly', async () => {
    const config = { endpoint: 'https://api.example.com' }
    const result = await plugin.validateConfiguration(config)
    expect(result).toBe(true)
  })
})
```

### Integration Tests

Test full TypeSpec compilation with your plugin:

```typescript
import { compile } from '@typespec/compiler'
import { describe, it, expect } from 'vitest'

describe('Integration Tests', () => {
  it('should generate correct AsyncAPI bindings', async () => {
    const typespecCode = `
      @bindings("my-cloud-service", { endpoint: "https://api.example.com" })
      @publish
      op publishMessage(): MyMessage;
    `
    
    const result = await compile(typespecCode, {
      emit: ['@typespec/asyncapi']
    })
    
    expect(result.diagnostics).toHaveLength(0)
    // Assert AsyncAPI output contains expected bindings
  })
})
```

## Documentation

### README.md

Your plugin's `docs/README.md` should include:

1. **Overview** - What the plugin does
2. **Installation** - How to install and set up
3. **Configuration** - All configuration options
4. **Usage Examples** - TypeSpec code samples
5. **API Reference** - Detailed API documentation
6. **Troubleshooting** - Common issues and solutions

### Examples

Provide practical examples in `docs/examples.md`:

```typescript
// Basic usage
@bindings("my-cloud-service", {
  endpoint: "https://api.example.com",
  timeout: 5000
})
@publish
op sendNotification(): NotificationMessage;

// Advanced configuration
@bindings("my-cloud-service", {
  endpoint: "https://api.example.com",
  auth: {
    type: "oauth",
    credentials: {
      clientId: "your-client-id",
      clientSecret: "your-client-secret"
    }
  },
  retries: 3,
  timeout: 10000
})
@subscribe  
op receiveEvents(): EventMessage;
```

## Publishing Checklist

Before publishing your plugin:

- [ ] All tests pass (`bun test`)
- [ ] TypeScript builds without errors (`bun run build`)
- [ ] Documentation is complete and accurate
- [ ] Plugin metadata in `plugin.json` is correct
- [ ] License file is included
- [ ] Version follows semantic versioning
- [ ] Examples are tested and working
- [ ] Security vulnerabilities scanned
- [ ] Peer dependencies are correct

## Best Practices

### Code Quality

- **Use Effect.TS patterns** for error handling
- **Validate all inputs** with proper error messages
- **Log operations** for debugging and monitoring
- **Handle edge cases** gracefully
- **Follow TypeScript strict mode** requirements

### Performance

- **Lazy load dependencies** when possible
- **Cache expensive operations** appropriately
- **Validate configurations early** to fail fast
- **Use streaming** for large data processing
- **Profile memory usage** for memory leaks

### Security

- **Never log sensitive data** (credentials, tokens)
- **Validate and sanitize** all external inputs
- **Use secure defaults** for configurations
- **Follow least privilege principle** for permissions
- **Keep dependencies updated** for security patches

### Compatibility

- **Test with multiple TypeSpec versions**
- **Support AsyncAPI 3.0.0 specification**
- **Handle version migration** gracefully
- **Document breaking changes** clearly
- **Provide upgrade guides** for major versions

## Support and Community

- **GitHub Issues**: Report bugs and request features
- **Discord**: Join the TypeSpec community Discord
- **Documentation**: Contribute to documentation improvements
- **Examples**: Share usage examples with the community

## License

This template is provided under MIT License. Update with your chosen license.