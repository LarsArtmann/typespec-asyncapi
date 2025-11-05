# IDE Integration for TypeSpec AsyncAPI

This document provides comprehensive setup instructions for IDE integration with the TypeSpec AsyncAPI emitter, including autocomplete, syntax highlighting, and real-time validation.

## VS Code Integration

### Prerequisites

1. Install the [TypeSpec for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=TypeSpec.typespec-vscode) extension
2. Ensure Node.js 18+ is installed
3. Install the TypeSpec AsyncAPI emitter in your project

### Project Setup

#### 1. Install the Emitter

```bash
# Using npm
bun add --save-dev @typespec/asyncapi

# Using bun (recommended)  
bun add --dev @typespec/asyncapi
```

#### 2. Create TypeSpec Configuration

Create `tspconfig.yaml` in your project root:

```yaml
emit:
  - "@typespec/asyncapi"
options:
  "@typespec/asyncapi":
    output-format: "yaml"
    output-file: "asyncapi"
```

#### 3. Create Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "typespec.compiler.emitter-options": {
    "@typespec/asyncapi": {
      "file-type": "yaml",
      "output-file": "api-spec"
    }
  },
  "typespec.compiler.trace": "verbose",
  "files.associations": {
    "*.tsp": "typespec"
  }
}
```

### Advanced Decorator Support

The TypeSpec AsyncAPI emitter provides the following advanced decorators with full IDE support:

#### Core Decorators

- `@channel(path)` - Define AsyncAPI channel paths
- `@publish` - Mark operations as message publishers  
- `@subscribe` - Mark operations as message subscribers
- `@message(config)` - Configure AsyncAPI message schemas
- `@server(name, config)` - Define AsyncAPI server configurations

#### Advanced Decorators (v1.0+)

- `@tags(tagArray)` - Apply categorization tags
- `@header` - Mark model properties as message headers
- `@correlationId(config)` - Configure message correlation tracking
- `@bindings(type, config)` - Define protocol-specific bindings
- `@protocol(config)` - Legacy protocol configuration
- `@security(config)` - Define security requirements

### Autocomplete Configuration

The VS Code TypeSpec extension automatically provides autocomplete for:

1. **Decorator Names**: All AsyncAPI decorators with parameter hints
2. **Parameter Types**: Strongly-typed configuration objects
3. **Channel Paths**: Path parameter syntax validation
4. **Protocol Types**: Supported protocol identifiers
5. **Tag Names**: Common tag naming patterns

### Example TypeSpec File

Create `main.tsp` with full IDE support:

```typespec
import "@typespec/asyncapi";

using TypeSpec.AsyncAPI;

@server("production", #{
  url: "https://api.example.com",
  protocol: "https",
  description: "Production API server"
})
namespace MyEventAPI;

@tags(["user", "authentication", "v1"])
@message(#{
  name: "UserLoginEvent", 
  title: "User Login Event",
  description: "Emitted when a user successfully logs in",
  contentType: "application/json"
})
model UserLoginEvent {
  @header messageId: string;
  @header correlationId?: string;
  
  userId: string;
  timestamp: utcDateTime;
  ipAddress?: string;
  userAgent?: string;
}

@correlationId(#{
  location: "$message.header#/correlationId",
  description: "Unique identifier for request-response correlation"
})
@bindings("kafka", #{
  topic: "user-events",
  key: "userId",
  partitions: 3,
  replicas: 2
})
@channel("/user/{userId}/login")
@publish
op publishUserLogin(userId: string): UserLoginEvent;
```

## Real-time Validation

### TypeSpec Language Server Features

The TypeSpec language server provides:

1. **Syntax Validation**: Real-time TypeScript and TypeSpec syntax checking
2. **Decorator Validation**: AsyncAPI-specific decorator parameter validation  
3. **Schema Validation**: AsyncAPI 3.0 specification compliance checking
4. **Cross-reference Validation**: Model and operation relationship validation

### Error Categories

#### Compilation Errors (Red Underlines)

- Invalid decorator syntax
- Missing required parameters
- Type mismatches
- Undefined references

#### Warnings (Yellow Underlines)

- Deprecated decorator usage
- Performance optimization suggestions
- Best practice recommendations

#### Information (Blue Underlines)

- Available parameter options
- Alternative decorator suggestions

### Custom Error Messages

The emitter provides detailed, actionable error messages:

```
❌ Error: Channel path '/user-events' is not valid
   Use format: /topic-name, /service/event-type, or {variable} syntax
   
💡 Suggestion: @channel("/user/{userId}/events")
```

## IntelliJ/WebStorm Integration

### Setup

1. Install the TypeSpec plugin (when available)
2. Configure TypeSpec file associations
3. Set up build tasks for AsyncAPI generation

### Configuration

Add to `.idea/vcs.xml` for version control integration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="VcsDirectoryMappings">
    <mapping directory="$PROJECT_DIR$" vcs="Git" />
  </component>
  <component name="TypeSpecSettings">
    <option name="emitters">
      <list>
        <option value="@typespec/asyncapi" />
      </list>
    </option>
  </component>
</project>
```

## Build Integration

### Package.json Scripts

Add TypeSpec build scripts to `package.json`:

```json
{
  "scripts": {
    "spec:build": "tsp compile .",
    "spec:watch": "tsp compile . --watch",
    "spec:clean": "rm -rf tsp-output/",
    "spec:validate": "asyncapi validate tsp-output/@typespec/asyncapi/asyncapi.yaml"
  }
}
```

### Pre-commit Hooks

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: typespec-compile
        name: TypeSpec Compilation
        entry: bun run spec:build
        language: system
        pass_filenames: false
        files: \.(tsp|yaml)$
        
      - id: asyncapi-validate  
        name: AsyncAPI Validation
        entry: bun run spec:validate
        language: system
        pass_filenames: false
        files: \.tsp$
```

### CI/CD Integration

#### GitHub Actions

Create `.github/workflows/typespec.yml`:

```yaml
name: TypeSpec AsyncAPI

on:
  push:
    paths: ['**.tsp', 'tspconfig.yaml']
  pull_request:
    paths: ['**.tsp', 'tspconfig.yaml']

jobs:
  typespec:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Compile TypeSpec
      run: bun run spec:build
      
    - name: Validate AsyncAPI
      run: bun run spec:validate
      
    - name: Upload AsyncAPI spec
      uses: actions/upload-artifact@v3
      with:
        name: asyncapi-spec
        path: tsp-output/@typespec/asyncapi/
```

## Debugging and Troubleshooting

### Common Issues

#### 1. Decorator Not Found

**Error**: `Decorator '@tags' not found`

**Solution**: Ensure proper import and namespace usage:
```typespec
import "@typespec/asyncapi";
using TypeSpec.AsyncAPI;
```

#### 2. Invalid Configuration Object

**Error**: `Invalid configuration structure`

**Solution**: Use TypeSpec object literal syntax:
```typespec
// ✅ Correct
@message(#{
  name: "EventName",
  contentType: "application/json"
})

// ❌ Incorrect  
@message({
  name: "EventName",
  contentType: "application/json"
})
```

#### 3. State Map Errors

**Error**: `State map 'tags' not found`

**Solution**: Ensure you're using compatible emitter version and proper decorator imports.

### Debug Configuration

Enable verbose logging in VS Code settings:

```json
{
  "typespec.compiler.trace": "verbose",
  "typespec.compiler.options": {
    "debug": true,
    "trace-resolution": true
  }
}
```

### Performance Optimization

#### Large Schema Performance

For projects with many TypeSpec files:

1. Use TypeSpec project references
2. Enable incremental compilation
3. Configure file watching exclusions

```json
{
  "typespec.compiler.options": {
    "incremental": true,
    "watch-exclude": ["node_modules/**", "tsp-output/**"]
  }
}
```

## Advanced IDE Features

### Custom Snippets

Create TypeSpec snippets in VS Code (`File > Preferences > Configure User Snippets`):

```json
{
  "AsyncAPI Event Operation": {
    "prefix": "async-event",
    "body": [
      "@tags([\"${1:category}\", \"${2:version}\"])",
      "@bindings(\"${3:kafka}\", #{",
      "  topic: \"${4:topic-name}\",",
      "  key: \"${5:partitionKey}\"",
      "})",
      "@channel(\"/${6:channel-path}\")",
      "@${7|publish,subscribe|}",
      "op ${8:operationName}(): ${9:MessageType};"
    ],
    "description": "Create AsyncAPI event operation with bindings"
  }
}
```

### Live Templates

For IntelliJ-based IDEs, create live templates for common AsyncAPI patterns.

## Community Extensions

### Recommended Extensions

1. **AsyncAPI Editor**: YAML/JSON editing with AsyncAPI schema validation
2. **REST Client**: Test HTTP-based AsyncAPI endpoints
3. **Protocol Buffers**: For Protobuf message schemas
4. **Docker**: Container-based AsyncAPI server development

### Extension Development

To create custom TypeSpec AsyncAPI extensions:

1. Use the TypeSpec Language Server Protocol APIs
2. Implement custom decorators with TypeScript
3. Provide schema validation and autocomplete
4. Integrate with existing IDE workflows

This comprehensive IDE integration enables productive TypeSpec AsyncAPI development with full tooling support, real-time validation, and seamless CI/CD integration.