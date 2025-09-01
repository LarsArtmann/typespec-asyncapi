# AsyncAPI Studio Compatibility Requirements

## Overview

AsyncAPI Studio (https://studio.asyncapi.com/) is the official web-based editor and visualizer for AsyncAPI specifications. This document outlines the compatibility requirements and best practices for ensuring our TypeSpec-generated AsyncAPI specifications work seamlessly with AsyncAPI Studio.

## AsyncAPI Studio Features

### Core Features
- **Visual Editor**: Drag-and-drop interface for designing AsyncAPI specifications
- **Code Editor**: Monaco-based editor with syntax highlighting and validation
- **Real-time Validation**: Live validation against AsyncAPI schema
- **Interactive Documentation**: Renders specifications as interactive documentation
- **Code Generation**: Generates code templates for various languages and frameworks
- **Import/Export**: Supports JSON and YAML formats

### Supported AsyncAPI Versions
- ✅ **AsyncAPI 3.0.0** - Full support (latest)
- ✅ **AsyncAPI 2.6.0** - Full support
- ✅ **AsyncAPI 2.5.0** - Full support
- ⚠️ **AsyncAPI 2.4.0 and below** - Limited support

## Compatibility Requirements

### 1. Specification Format Requirements

#### Required Fields
```yaml
# MUST be present for Studio compatibility
asyncapi: "3.0.0"  # Version string is required
info:
  title: "API Title"  # Required
  version: "1.0.0"   # Required
```

#### Recommended Fields for Better Studio Experience
```yaml
info:
  description: "Detailed API description"  # Enhances documentation rendering
  contact:
    name: "Support Team"
    url: "https://example.com/support"
    email: "support@example.com"
  license:
    name: "MIT"
    url: "https://opensource.org/licenses/MIT"
```

### 2. Server Definitions

#### Studio-Compatible Server Format
```yaml
servers:
  production:
    host: "api.example.com"
    protocol: "kafka"  # Must be a recognized protocol
    description: "Production Kafka cluster"
    protocolVersion: "2.8.0"  # Optional but recommended
    bindings:  # Protocol-specific bindings
      kafka:
        schemaRegistryUrl: "https://schema-registry.example.com"
        bindingVersion: "0.5.0"
```

#### Supported Protocols in Studio
- ✅ **kafka** - Full visualization and validation
- ✅ **websocket** - Full visualization support  
- ✅ **http** - Full visualization support
- ✅ **mqtt** - Full visualization support
- ✅ **amqp** - Full visualization support
- ⚠️ **Custom protocols** - Limited support, may show warnings

### 3. Channel Definitions

#### Studio-Optimized Channel Format
```yaml
channels:
  "user.events":
    address: "user.events"  # AsyncAPI 3.0 format
    messages:
      UserCreated:
        name: "UserCreated"
        title: "User Created Event"  # Displayed in Studio UI
        description: "Triggered when user account is created"
        contentType: "application/json"
        payload:
          $ref: "#/components/schemas/UserCreatedPayload"
        examples:  # Enhances Studio documentation
          - name: "Basic Example"
            summary: "Standard user creation"
            payload:
              userId: "user-123"
              email: "user@example.com"
```

### 4. Operation Definitions

#### Studio-Compatible Operations
```yaml
operations:
  publishUserCreated:
    action: "send"  # Must be "send" or "receive"
    channel:
      $ref: "#/channels/user.events"
    title: "Publish User Created Event"  # Displayed in Studio
    description: "Publishes user creation events to Kafka"
    bindings:  # Protocol-specific operation bindings
      kafka:
        groupId: "user-service"
        clientId: "user-publisher"
        bindingVersion: "0.5.0"
```

### 5. Schema Definitions

#### JSON Schema Compatibility
AsyncAPI Studio uses JSON Schema Draft 7 for schema validation and rendering:

```yaml
components:
  schemas:
    UserCreatedPayload:
      type: "object"
      title: "User Created Event Payload"  # Displayed in Studio
      description: "Payload for user creation events"
      properties:
        userId:
          type: "string"
          description: "Unique user identifier"
          pattern: "^user_[a-zA-Z0-9]{8,16}$"
        email:
          type: "string"
          format: "email"
          description: "User email address"
        createdAt:
          type: "string"
          format: "date-time"
          description: "Account creation timestamp"
      required: ["userId", "email", "createdAt"]
      examples:  # Studio shows these in documentation
        - userId: "user_abc123def456"
          email: "john.doe@example.com"
          createdAt: "2024-01-15T10:30:00Z"
```

### 6. Protocol Bindings Compatibility

#### Kafka Bindings (AsyncAPI Kafka Binding v0.5.0)
```yaml
# Server Binding
servers:
  kafka:
    bindings:
      kafka:
        schemaRegistryUrl: "https://schema-registry.example.com"
        schemaRegistryVendor: "confluent"
        bindingVersion: "0.5.0"

# Channel Binding  
channels:
  "events":
    bindings:
      kafka:
        topic: "user-events"
        partitions: 3
        replicas: 2
        bindingVersion: "0.5.0"

# Operation Binding
operations:
  publishEvent:
    bindings:
      kafka:
        groupId: "publisher-group"
        clientId: "event-publisher"
        bindingVersion: "0.5.0"

# Message Binding
components:
  messages:
    UserEvent:
      bindings:
        kafka:
          key:
            type: "string"
            description: "User ID for partitioning"
          schemaIdLocation: "header"
          schemaLookupStrategy: "TopicIdStrategy" 
          bindingVersion: "0.5.0"
```

#### WebSocket Bindings (AsyncAPI WebSocket Binding v0.1.0)
```yaml
channels:
  "notifications":
    bindings:
      ws:
        method: "GET"
        query:
          type: "object"
          properties:
            token:
              type: "string"
        headers:
          type: "object"
          properties:
            Authorization:
              type: "string"
        bindingVersion: "0.1.0"
```

## Studio Validation Requirements

### 1. Schema Validation
- All schemas must be valid JSON Schema Draft 7
- `$ref` references must resolve correctly
- Circular references should be avoided or handled properly

### 2. Required Metadata
- `info.title` and `info.version` are mandatory
- Channel names must be valid strings
- Operation actions must be "send" or "receive"

### 3. Binding Version Compliance
- All bindings should specify `bindingVersion`
- Use officially supported binding versions:
  - Kafka: `"0.5.0"`
  - WebSocket: `"0.1.0"`
  - HTTP: `"0.3.0"`
  - MQTT: `"0.2.0"`

## Best Practices for Studio Integration

### 1. Documentation Enhancement
```yaml
# Add rich descriptions everywhere
info:
  description: |
    # User Events API
    
    This API handles user lifecycle events including:
    - User registration and account creation
    - Profile updates and modifications  
    - Account deactivation and deletion
    
    ## Authentication
    All operations require valid JWT authentication.
    
    ## Rate Limits
    - 1000 requests per minute per API key
    - Burst allowance: 100 additional requests

channels:
  "user.events":
    description: |
      User lifecycle events channel.
      
      **Partitioning Strategy**: Messages are partitioned by `userId`
      **Retention**: 7 days
      **Replication Factor**: 3
```

### 2. Comprehensive Examples
```yaml
components:
  messages:
    UserCreated:
      examples:
        - name: "Free User Registration"
          summary: "New free tier user account"
          payload:
            userId: "user_free123"
            email: "free.user@example.com"
            accountType: "free"
        - name: "Premium User Registration"
          summary: "New premium user account with trial"
          payload:
            userId: "user_prem456"
            email: "premium.user@example.com"
            accountType: "premium"
            trialEndsAt: "2024-02-15T00:00:00Z"
```

### 3. Clear Operation Titles
```yaml
operations:
  publishUserCreated:
    title: "Publish User Created Event"
    summary: "Notifies downstream services of new user registration"
    description: |
      This operation publishes a user creation event to the user.events
      channel whenever a new user account is successfully created.
      
      **Triggers**: User registration form submission, OAuth signup
      **Downstream Consumers**: Email service, Analytics service, CRM
```

## Testing Studio Compatibility

### 1. Validation Checklist
- [ ] Specification validates with AsyncAPI CLI
- [ ] All `$ref` references resolve correctly
- [ ] No circular references in schemas
- [ ] All required fields are present
- [ ] Binding versions are specified and supported

### 2. Studio Import Testing
1. **Direct Import**: Copy specification into Studio code editor
2. **File Import**: Upload JSON/YAML file to Studio
3. **URL Import**: Host specification and import via URL
4. **Visual Editor**: Test drag-and-drop functionality

### 3. Validation Commands
```bash
# Validate with AsyncAPI CLI
bunx asyncapi validate asyncapi.yaml

# Check Studio compatibility 
just check-studio-compatibility

# Generate and validate
just validate-generated
```

## Common Compatibility Issues

### 1. Unsupported AsyncAPI Features
- **Correlation IDs**: Limited Studio support
- **Message Traits**: Basic support only  
- **Custom Extensions**: May not render properly

### 2. Binding Version Mismatches
```yaml
# ❌ Problematic - no binding version
bindings:
  kafka:
    topic: "events"

# ✅ Studio-compatible - with binding version  
bindings:
  kafka:
    topic: "events"
    bindingVersion: "0.5.0"
```

### 3. Complex Schema References
```yaml
# ❌ May cause Studio issues - nested $ref chains
components:
  schemas:
    UserEvent:
      $ref: "#/components/schemas/BaseEvent"
    BaseEvent:
      allOf:
        - $ref: "#/components/schemas/EventMetadata"
        - $ref: "#/components/schemas/EventPayload"

# ✅ Studio-friendly - flattened schema
components:
  schemas:
    UserEvent:
      type: "object"
      title: "User Event"
      properties:
        # Inline all properties for better Studio support
        eventId: { type: "string" }
        userId: { type: "string" }
        timestamp: { type: "string", format: "date-time" }
```

## Integration Testing Workflow

### 1. Automated Testing
```bash
# Full compatibility test pipeline
just build
just compile
just validate-asyncapi
just check-studio-compatibility
```

### 2. Manual Studio Testing
1. Open https://studio.asyncapi.com/
2. Import generated specification
3. Verify visual rendering
4. Test interactive documentation
5. Check code generation features

### 3. Continuous Integration
```yaml
# GitHub Actions example
name: AsyncAPI Studio Compatibility
jobs:
  studio-compatibility:
    steps:
      - run: bunx asyncapi validate asyncapi.yaml
      - run: just check-studio-compatibility
      - name: Studio Import Test
        run: |
          # Test that spec can be imported into Studio
          curl -X POST "https://studio.asyncapi.com/api/validate" \
               -H "Content-Type: application/json" \
               -d @asyncapi.json
```

This document ensures our TypeSpec AsyncAPI emitter generates specifications that are fully compatible with AsyncAPI Studio, providing the best possible developer experience for API design and documentation.