# Data Types: TypeSpec to AsyncAPI Type System Mapping

## Overview

This document provides comprehensive mapping between TypeSpec's type system and AsyncAPI's JSON Schema-based message schemas. Understanding these mappings is crucial for creating accurate message definitions in event-driven architectures.

## Scalar Type Mappings

### Primitive Types

| TypeSpec Type | AsyncAPI JSON Schema                        | Validation           | Example                 |
| ------------- | ------------------------------------------- | -------------------- | ----------------------- |
| `string`      | `{ "type": "string" }`                      | Length, pattern      | `"hello world"`         |
| `boolean`     | `{ "type": "boolean" }`                     | None                 | `true`, `false`         |
| `int32`       | `{ "type": "integer", "format": "int32" }`  | Range: -2³¹ to 2³¹-1 | `42`                    |
| `int64`       | `{ "type": "integer", "format": "int64" }`  | Range: -2⁶³ to 2⁶³-1 | `"9223372036854775807"` |
| `float32`     | `{ "type": "number", "format": "float" }`   | IEEE 754 single      | `3.14`                  |
| `float64`     | `{ "type": "number", "format": "double" }`  | IEEE 754 double      | `3.141592653589793`     |
| `decimal`     | `{ "type": "string", "format": "decimal" }` | Arbitrary precision  | `"123.456789"`          |
| `bytes`       | `{ "type": "string", "format": "binary" }`  | Base64 encoding      | `"base64data"`          |
| `unknown`     | `{}`                                        | No constraints       | Any valid JSON          |

### Date/Time Types

| TypeSpec Type | AsyncAPI JSON Schema                          | Format     | Example                  |
| ------------- | --------------------------------------------- | ---------- | ------------------------ |
| `utcDateTime` | `{ "type": "string", "format": "date-time" }` | RFC 3339   | `"2023-12-25T10:30:00Z"` |
| `plainDate`   | `{ "type": "string", "format": "date" }`      | YYYY-MM-DD | `"2023-12-25"`           |
| `plainTime`   | `{ "type": "string", "format": "time" }`      | HH:MM:SS   | `"10:30:00"`             |

#### Example:

```typespec
// TypeSpec
model EventMetadata {
  timestamp: utcDateTime;
  eventDate: plainDate;
  processTime: plainTime;
  eventId: string;
  version: int32;
  isValid: boolean;
  payloadSize: int64;
  confidence: float32;
  binaryData: bytes;
  extensions: unknown;
}
```

```yaml
# AsyncAPI JSON Schema
EventMetadata:
  type: object
  properties:
    timestamp:
      type: string
      format: date-time
    eventDate:
      type: string
      format: date
    processTime:
      type: string
      format: time
    eventId:
      type: string
    version:
      type: integer
      format: int32
    isValid:
      type: boolean
    payloadSize:
      type: integer
      format: int64
    confidence:
      type: number
      format: float
    binaryData:
      type: string
      format: binary
    extensions: {}
  required:
    - timestamp
    - eventId
    - version
    - isValid
```

## Custom Scalar Types

### String-Based Scalars

```typespec
// TypeSpec
scalar UserId extends string;
scalar EmailAddress extends string;
scalar PhoneNumber extends string;

model User {
  id: UserId;
  email: EmailAddress;
  phone?: PhoneNumber;
}
```

```yaml
# AsyncAPI - Scalar extensions map to base types
User:
  type: object
  properties:
    id:
      type: string
      description: "User identifier"
    email:
      type: string
      format: email
      description: "Email address"
    phone:
      type: string
      description: "Phone number"
  required:
    - id
    - email
```

### Validated Scalars

```typespec
// TypeSpec with validation
@format("uuid")
scalar UUID extends string;

@minLength(1)
@maxLength(100)
scalar Name extends string;

@minValue(0)
@maxValue(150)
scalar Age extends int32;
```

```yaml
# AsyncAPI with validation
UUID:
  type: string
  format: uuid

Name:
  type: string
  minLength: 1
  maxLength: 100

Age:
  type: integer
  format: int32
  minimum: 0
  maximum: 150
```

## Enum Types

### String Enums

```typespec
// TypeSpec
enum Status {
  Pending: "pending",
  InProgress: "in-progress",
  Completed: "completed",
  Failed: "failed"
}

enum UserRole {
  Admin,
  User,
  Guest
}
```

```yaml
# AsyncAPI
Status:
  type: string
  enum:
    - pending
    - in-progress
    - completed
    - failed

UserRole:
  type: string
  enum:
    - Admin
    - User
    - Guest
```

### Numeric Enums

```typespec
// TypeSpec
enum Priority {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
}
```

```yaml
# AsyncAPI
Priority:
  type: integer
  enum: [1, 2, 3, 4]
  x-enum-names:
    - Low
    - Medium
    - High
    - Critical
```

## Union Types

### Discriminated Unions

```typespec
// TypeSpec
@discriminator("type")
union Event {
  user: UserEvent,
  order: OrderEvent,
  system: SystemEvent
}

model UserEvent {
  type: "user";
  userId: string;
  action: string;
}

model OrderEvent {
  type: "order";
  orderId: string;
  status: string;
}

model SystemEvent {
  type: "system";
  component: string;
  severity: string;
}
```

```yaml
# AsyncAPI
Event:
  oneOf:
    - $ref: '#/components/schemas/UserEvent'
    - $ref: '#/components/schemas/OrderEvent'
    - $ref: '#/components/schemas/SystemEvent'
  discriminator:
    propertyName: type
    mapping:
      user: '#/components/schemas/UserEvent'
      order: '#/components/schemas/OrderEvent'
      system: '#/components/schemas/SystemEvent'

UserEvent:
  type: object
  properties:
    type:
      type: string
      const: user
    userId:
      type: string
    action:
      type: string
  required: [type, userId, action]
```

### Simple Unions

```typespec
// TypeSpec
model Response {
  data: string | int32 | boolean;
  status: "success" | "error";
}
```

```yaml
# AsyncAPI
Response:
  type: object
  properties:
    data:
      anyOf:
        - type: string
        - type: integer
          format: int32
        - type: boolean
    status:
      type: string
      enum: [success, error]
```

## Array Types

### Simple Arrays

```typespec
// TypeSpec
model UserList {
  users: string[];
  tags: string[];
  scores: float32[];
  metadata: Record<string>;
}
```

```yaml
# AsyncAPI
UserList:
  type: object
  properties:
    users:
      type: array
      items:
        type: string
    tags:
      type: array
      items:
        type: string
    scores:
      type: array
      items:
        type: number
        format: float
    metadata:
      type: object
      additionalProperties:
        type: string
```

### Validated Arrays

```typespec
// TypeSpec
model ValidatedList {
  @minItems(1)
  @maxItems(10)
  items: string[];

  @uniqueItems(true)
  uniqueIds: string[];
}
```

```yaml
# AsyncAPI
ValidatedList:
  type: object
  properties:
    items:
      type: array
      items:
        type: string
      minItems: 1
      maxItems: 10
    uniqueIds:
      type: array
      items:
        type: string
      uniqueItems: true
```

## Template Types (Generics)

### Generic Models

```typespec
// TypeSpec
model Response<T> {
  data: T;
  success: boolean;
  timestamp: utcDateTime;
}

model PagedResult<T> {
  items: T[];
  total: int32;
  hasMore: boolean;
}

// Usage
model UserResponse is Response<User>;
model UserList is PagedResult<User>;
```

```yaml
# AsyncAPI - Templates are instantiated
UserResponse:
  type: object
  properties:
    data:
      $ref: '#/components/schemas/User'
    success:
      type: boolean
    timestamp:
      type: string
      format: date-time

UserList:
  type: object
  properties:
    items:
      type: array
      items:
        $ref: '#/components/schemas/User'
    total:
      type: integer
      format: int32
    hasMore:
      type: boolean
```

### Complex Generics

```typespec
// TypeSpec
model ApiResponse<TData, TError = string> {
  data?: TData;
  error?: TError;
  code: int32;
}

model ValidationError {
  field: string;
  message: string;
}

// Instantiations
model UserResponse is ApiResponse<User, ValidationError>;
model SimpleResponse is ApiResponse<string>; // Uses default TError
```

```yaml
# AsyncAPI - Each instantiation becomes a schema
UserResponse:
  type: object
  properties:
    data:
      $ref: '#/components/schemas/User'
    error:
      $ref: '#/components/schemas/ValidationError'
    code:
      type: integer
      format: int32

SimpleResponse:
  type: object
  properties:
    data:
      type: string
    error:
      type: string
    code:
      type: integer
      format: int32
```

## Record and Map Types

### Record Types

```typespec
// TypeSpec
model Configuration {
  settings: Record<string>;           // { [key: string]: string }
  metadata: Record<unknown>;          // { [key: string]: any }
  counters: Record<int32>;           // { [key: string]: number }
}
```

```yaml
# AsyncAPI
Configuration:
  type: object
  properties:
    settings:
      type: object
      additionalProperties:
        type: string
    metadata:
      type: object
      additionalProperties: {}
    counters:
      type: object
      additionalProperties:
        type: integer
        format: int32
```

### Constrained Records

```typespec
// TypeSpec
model ConstrainedConfig {
  @minProperties(1)
  @maxProperties(10)
  settings: Record<string>;
}
```

```yaml
# AsyncAPI
ConstrainedConfig:
  type: object
  properties:
    settings:
      type: object
      additionalProperties:
        type: string
      minProperties: 1
      maxProperties: 10
```

## Optional and Required Fields

### TypeSpec Optional Syntax

```typespec
// TypeSpec
model User {
  // Required fields
  id: string;
  name: string;

  // Optional fields
  email?: string;
  phone?: string;
  age?: int32;

  // Default values
  isActive: boolean = true;
  role: string = "user";
}
```

```yaml
# AsyncAPI
User:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    email:
      type: string
    phone:
      type: string
    age:
      type: integer
      format: int32
    isActive:
      type: boolean
      default: true
    role:
      type: string
      default: user
  required:
    - id
    - name
    - isActive
    - role
```

## Validation Decorators Mapping

### String Validation

```typespec
// TypeSpec
model ValidatedStrings {
  @minLength(3)
  @maxLength(50)
  username: string;

  @pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
  email: string;

  @format("uri")
  website: string;

  @format("uuid")
  id: string;
}
```

```yaml
# AsyncAPI
ValidatedStrings:
  type: object
  properties:
    username:
      type: string
      minLength: 3
      maxLength: 50
    email:
      type: string
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    website:
      type: string
      format: uri
    id:
      type: string
      format: uuid
```

### Numeric Validation

```typespec
// TypeSpec
model ValidatedNumbers {
  @minValue(0)
  @maxValue(100)
  percentage: float32;

  @minValueExclusive(0)
  positiveAmount: decimal;

  @maxValueExclusive(10)
  lessThanTen: int32;

  @multipleOf(5)
  fiveMultiple: int32;
}
```

```yaml
# AsyncAPI
ValidatedNumbers:
  type: object
  properties:
    percentage:
      type: number
      format: float
      minimum: 0
      maximum: 100
    positiveAmount:
      type: string
      format: decimal
      exclusiveMinimum: 0
    lessThanTen:
      type: integer
      format: int32
      exclusiveMaximum: 10
    fiveMultiple:
      type: integer
      format: int32
      multipleOf: 5
```

## Conditional Types and Polymorphism

### Conditional Types

```typespec
// TypeSpec
model ConditionalResponse<T extends string> {
  type: T;
  data: T extends "user" ? User : T extends "order" ? Order : unknown;
}
```

```yaml
# AsyncAPI - Resolved per instantiation
ConditionalUserResponse:
  type: object
  properties:
    type:
      type: string
      const: user
    data:
      $ref: '#/components/schemas/User'

ConditionalOrderResponse:
  type: object
  properties:
    type:
      type: string
      const: order
    data:
      $ref: '#/components/schemas/Order'
```

### Model Inheritance

```typespec
// TypeSpec
model BaseEntity {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User extends BaseEntity {
  name: string;
  email: string;
}

model Order extends BaseEntity {
  userId: string;
  amount: decimal;
}
```

```yaml
# AsyncAPI - Using allOf pattern
BaseEntity:
  type: object
  properties:
    id:
      type: string
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
  required: [id, createdAt, updatedAt]

User:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        name:
          type: string
        email:
          type: string
      required: [name, email]

Order:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        userId:
          type: string
        amount:
          type: string
          format: decimal
      required: [userId, amount]
```

## Complex Nested Structures

### Deep Nesting

```typespec
// TypeSpec
model Company {
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: float64;
      longitude: float64;
    };
  };
  employees: {
    id: string;
    name: string;
    department: {
      name: string;
      budget: decimal;
    };
  }[];
}
```

```yaml
# AsyncAPI - Flatten or use references
Company:
  type: object
  properties:
    name:
      type: string
    address:
      $ref: '#/components/schemas/Address'
    employees:
      type: array
      items:
        $ref: '#/components/schemas/Employee'

Address:
  type: object
  properties:
    street:
      type: string
    city:
      type: string
    country:
      type: string
    coordinates:
      $ref: '#/components/schemas/Coordinates'
  required: [street, city, country]

Coordinates:
  type: object
  properties:
    latitude:
      type: number
      format: double
    longitude:
      type: number
      format: double

Employee:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    department:
      $ref: '#/components/schemas/Department'

Department:
  type: object
  properties:
    name:
      type: string
    budget:
      type: string
      format: decimal
```

## Type Mapping Best Practices

### 1. Schema Organization

- Use `components/schemas` for reusable types
- Create separate schemas for complex nested objects
- Prefer composition over deep nesting

### 2. Validation Strategy

- Apply validation at message boundaries
- Use format validators for structured strings
- Consider protocol-specific constraints

### 3. Evolution Patterns

- Design for backward compatibility
- Use optional fields for extensibility
- Version schemas when making breaking changes

### 4. Performance Considerations

- Avoid excessive nesting levels (>3-4 levels)
- Use references to reduce schema size
- Consider serialization performance for large schemas

## Common Type Mapping Pitfalls

### 1. Lost Type Information

```typespec
// TypeSpec - Rich type information
scalar UserId extends string;
scalar OrderId extends string;

// AsyncAPI - Both become strings
// Solution: Use descriptions and examples
```

### 2. Generic Type Explosion

```typespec
// Problem: Too many generic instantiations
model Response<T, E, M> // Creates many schema variants

// Solution: Limit generic parameters or use composition
```

### 3. Complex Union Types

```typespec
// Problem: Complex unions hard to validate
union ComplexData { /* many variants */ }

// Solution: Use discriminated unions
```

## Next Steps

Understanding these type mappings enables:

- **Operation Mapping** - How TypeSpec operations become AsyncAPI channels
- **Schema Patterns** - Advanced schema composition techniques
- **Message Design** - Effective event payload structures
- **Protocol Bindings** - Type-aware protocol configurations

---

_This comprehensive type mapping forms the foundation for all message schema generation in the TypeSpec to AsyncAPI transformation process._
