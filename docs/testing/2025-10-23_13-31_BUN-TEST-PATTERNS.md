# Bun Test Patterns & Best Practices

**Last Updated:** 2025-10-07
**Test Framework:** Bun v1.2.21
**Purpose:** Document Bun-specific test patterns and limitations discovered during TypeSpec AsyncAPI development

---

## 🚨 CRITICAL: Bun vs Jest Matcher Differences

### ⚠️ DO NOT USE: `toHaveProperty()`

**Problem:** Bun's `toHaveProperty()` matcher doesn't work correctly with object properties from parsed JSON or complex objects.

**Symptom:**

```typescript
// This FAILS even when property exists!
expect(asyncapiDoc.channels).toHaveProperty('simple.event')
// Error: Unable to find property

// But this shows it DOES exist:
console.log(Object.keys(asyncapiDoc.channels))
// Output: ['simple.event']
```

**Root Cause:**

- Bun's matcher implementation differs from Jest
- May be related to property descriptors or prototype chain
- AsyncAPI objects parsed from YAML/JSON have different property characteristics

### ✅ USE THIS INSTEAD: `Object.keys()` + `toContain()`

**Correct Pattern:**

```typescript
// ✅ WORKS: Check if property key exists
const channelKeys = Object.keys(asyncapiDoc.channels || {})
expect(channelKeys).toContain('simple.event')

// ✅ WORKS: Check multiple properties
expect(channelKeys).toContain('user.events')
expect(channelKeys).toContain('system.events')

// ✅ WORKS: Verify property count
expect(channelKeys.length).toBe(2)

// ✅ WORKS: Check property doesn't exist
expect(channelKeys).not.toContain('nonexistent.channel')
```

---

## 📚 Standard Bun Test Patterns

### 1. **Checking Object Properties**

#### ❌ DON'T (Jest pattern - doesn't work in Bun)

```typescript
expect(asyncapiDoc).toHaveProperty('asyncapi')
expect(asyncapiDoc.channels).toHaveProperty('events')
expect(asyncapiDoc.operations).toHaveProperty('publishEvent')
```

#### ✅ DO (Bun-compatible pattern)

```typescript
// Check property exists using Object.keys
const keys = Object.keys(asyncapiDoc)
expect(keys).toContain('asyncapi')

// Check nested property exists
const channelKeys = Object.keys(asyncapiDoc.channels || {})
expect(channelKeys).toContain('events')

// Or use direct property access with toBeDefined
expect(asyncapiDoc.asyncapi).toBeDefined()
expect(asyncapiDoc.channels['events']).toBeDefined()
```

---

### 2. **Checking Property Values**

#### ✅ Direct Value Checks (These work fine)

```typescript
// Direct value comparison - WORKS
expect(asyncapiDoc.asyncapi).toBe('3.0.0')
expect(asyncapiDoc.info.title).toBe('My API')

// Type checks - WORKS
expect(typeof asyncapiDoc.channels).toBe('object')
expect(Array.isArray(asyncapiDoc.servers)).toBe(true)

// Undefined checks - WORKS
expect(asyncapiDoc.info.description).toBeDefined()
expect(asyncapiDoc.info.termsOfService).toBeUndefined()
```

---

### 3. **Checking Arrays**

#### ✅ Array Patterns (These work fine)

```typescript
// Check array contains item - WORKS
const operationKeys = Object.keys(asyncapiDoc.operations)
expect(operationKeys).toContain('publishEvent')

// Check array length - WORKS
expect(operationKeys.length).toBe(2)

// Check array is not empty - WORKS
expect(operationKeys.length).toBeGreaterThan(0)

// Check specific index - WORKS
expect(operationKeys[0]).toBe('publishEvent')
```

---

### 4. **Checking Object Structure**

#### ✅ Structure Validation Patterns

```typescript
// Validate required top-level properties
function assertValidAsyncAPI(doc: unknown): asserts doc is AsyncAPIDoc {
  expect(doc).toBeDefined()
  expect(typeof doc).toBe('object')
  expect(doc).not.toBeNull()

  const typed = doc as AsyncAPIDoc

  // Check required properties exist
  expect(typed.asyncapi).toBeDefined()
  expect(typed.info).toBeDefined()
  expect(typed.channels).toBeDefined()

  // Check required values
  expect(typed.asyncapi).toBe('3.0.0')
  expect(typed.info.title).toBeDefined()
  expect(typed.info.version).toBeDefined()
}

// Usage
assertValidAsyncAPI(testResult.asyncapiDoc)
// Now TypeScript knows asyncapiDoc is valid
```

---

### 5. **Checking Optional Properties**

#### ✅ Optional Property Patterns

```typescript
// Safe optional chaining with default
const description = asyncapiDoc.info.description ?? 'No description'
expect(description).toBeDefined()

// Check if optional property exists
if ('description' in asyncapiDoc.info) {
  expect(asyncapiDoc.info.description).toBeTypeOf('string')
}

// Use Object.keys to check existence
const infoKeys = Object.keys(asyncapiDoc.info)
const hasDescription = infoKeys.includes('description')
expect(hasDescription).toBe(true)
```

---

## 🎯 Common Test Scenarios

### Scenario 1: Verify Channel Exists

```typescript
test('should create channel for operation', async () => {
  const result = await compileWithCLI(source)

  // ✅ Correct pattern
  const channelKeys = Object.keys(result.asyncapiDoc?.channels || {})
  expect(channelKeys).toContain('user.events')

  // Additional checks
  expect(channelKeys.length).toBeGreaterThan(0)
  expect(result.asyncapiDoc?.channels?.['user.events']).toBeDefined()
})
```

### Scenario 2: Verify Operation Exists

```typescript
test('should create operation', async () => {
  const result = await compileWithCLI(source)

  // ✅ Correct pattern
  const operationKeys = Object.keys(result.asyncapiDoc?.operations || {})
  expect(operationKeys).toContain('publishUserEvent')

  // Check operation properties
  const operation = result.asyncapiDoc?.operations?.['publishUserEvent']
  expect(operation).toBeDefined()
  expect(operation?.action).toBe('send')
})
```

### Scenario 3: Verify Schema Component Exists

```typescript
test('should create schema component for model', async () => {
  const result = await compileWithCLI(source)

  // ✅ Correct pattern
  const schemaKeys = Object.keys(result.asyncapiDoc?.components?.schemas || {})
  expect(schemaKeys).toContain('UserEvent')

  // Check schema properties
  const schema = result.asyncapiDoc?.components?.schemas?.['UserEvent']
  expect(schema).toBeDefined()
  expect(schema?.type).toBe('object')
  expect(schema?.properties).toBeDefined()
})
```

### Scenario 4: Verify Multiple Properties

```typescript
test('should create multiple channels', async () => {
  const result = await compileWithCLI(source)

  // ✅ Correct pattern - check all at once
  const channelKeys = Object.keys(result.asyncapiDoc?.channels || {})
  expect(channelKeys).toContain('user.events')
  expect(channelKeys).toContain('system.events')
  expect(channelKeys).toContain('notification.events')

  // Or check array equality if order matters
  expect(channelKeys.sort()).toEqual([
    'notification.events',
    'system.events',
    'user.events',
  ])
})
```

### Scenario 5: Verify Property Doesn't Exist

```typescript
test('should not create channel for internal operation', async () => {
  const result = await compileWithCLI(source)

  // ✅ Correct pattern
  const channelKeys = Object.keys(result.asyncapiDoc?.channels || {})
  expect(channelKeys).not.toContain('internal.events')
})
```

---

## 🔧 Bun Test Limitations

### Known Issues:

1. **`toHaveProperty()` doesn't work with JSON-parsed objects**
   - Use `Object.keys().toContain()` instead

2. **Property descriptor differences**
   - Objects from YAML/JSON parsing have different characteristics
   - Bun's matcher may check property descriptors, not just key existence

3. **Prototype chain differences**
   - May not traverse prototype chain like Jest does
   - Stick to own properties with `Object.keys()`

---

## 📝 Test Helper Utilities

### Recommended Helper Functions

```typescript
// test/utils/assertion-helpers.ts

/**
 * Check if object has property by key
 * Bun-compatible alternative to toHaveProperty()
 */
export function assertHasProperty<T extends object>(
  obj: T | undefined | null,
  key: string,
  message?: string
): void {
  const keys = Object.keys(obj || {})
  if (!keys.includes(key)) {
    throw new Error(
      message || `Expected object to have property "${key}". Found: ${keys.join(', ')}`
    )
  }
}

/**
 * Check if object has all specified properties
 */
export function assertHasProperties<T extends object>(
  obj: T | undefined | null,
  ...keys: string[]
): void {
  const objectKeys = Object.keys(obj || {})
  const missing = keys.filter(k => !objectKeys.includes(k))

  if (missing.length > 0) {
    throw new Error(
      `Missing properties: ${missing.join(', ')}. Found: ${objectKeys.join(', ')}`
    )
  }
}

/**
 * Type guard for AsyncAPI document
 */
export function assertAsyncAPIDoc(
  doc: unknown
): asserts doc is AsyncAPIObject {
  expect(doc).toBeDefined()
  expect(typeof doc).toBe('object')

  const typed = doc as AsyncAPIObject

  // Required AsyncAPI 3.0 properties
  expect(typed.asyncapi).toBe('3.0.0')
  expect(typed.info).toBeDefined()
  expect(typed.info.title).toBeDefined()
  expect(typed.info.version).toBeDefined()
}

/**
 * Get property keys safely with type narrowing
 */
export function getPropertyKeys<T extends object>(
  obj: T | undefined | null
): string[] {
  return Object.keys(obj || {})
}
```

### Usage Example:

```typescript
import { assertHasProperty, assertHasProperties, getPropertyKeys } from '../utils/assertion-helpers'

test('my test', async () => {
  const result = await compileWithCLI(source)

  // Use helpers instead of toHaveProperty
  const channelKeys = getPropertyKeys(result.asyncapiDoc?.channels)
  assertHasProperty(result.asyncapiDoc?.channels, 'user.events')
  assertHasProperties(
    result.asyncapiDoc?.operations,
    'publishUserEvent',
    'subscribeUserEvent'
  )
})
```

---

## ✅ Checklist for Writing Bun Tests

When writing new tests:

- [ ] Never use `toHaveProperty()` - use `Object.keys().toContain()` instead
- [ ] Extract `Object.keys()` to a variable for readability
- [ ] Use direct property access with `toBeDefined()` when possible
- [ ] Add null coalescing (`|| {}`) for optional objects
- [ ] Create type guards for complex object validation
- [ ] Use helper functions for common patterns
- [ ] Test both positive and negative cases
- [ ] Verify compilation succeeded before checking output

---

## 🐛 Debugging Failed Tests

When a test fails:

1. **Add Debug Logging:**

   ```typescript
   console.log('Keys:', Object.keys(asyncapiDoc.channels))
   console.log('Full object:', JSON.stringify(asyncapiDoc, null, 2))
   ```

2. **Check Type:**

   ```typescript
   console.log('Type:', typeof asyncapiDoc.channels)
   console.log('Is Object:', Object.prototype.toString.call(asyncapiDoc.channels))
   ```

3. **Verify Property Exists:**

   ```typescript
   console.log('Has property:', 'simple.event' in asyncapiDoc.channels)
   console.log('Direct access:', asyncapiDoc.channels['simple.event'])
   ```

4. **Check Compilation:**
   ```typescript
   if (result.exitCode !== 0) {
     console.error('Compilation failed!')
     console.error('stderr:', result.stderr)
     console.error('stdout:', result.stdout)
   }
   ```

---

## 📚 Additional Resources

- **Bun Test Documentation:** https://bun.sh/docs/cli/test
- **Bun Test API Reference:** https://bun.sh/docs/test/writing
- **Bun GitHub Issues:** Search for "toHaveProperty" issues

---

## 🎓 Lessons Learned

1. **Always verify test framework compatibility** - Don't assume Jest patterns work in Bun
2. **Debug with data, not assumptions** - Use `console.log` to see actual structure
3. **Document framework-specific patterns** - Save others from same debugging time
4. **Create helper utilities** - Abstract framework differences
5. **Test the tests** - Verify matchers work as expected

---

**Remember:** When in doubt, use `Object.keys()` + `toContain()` for property checks in Bun tests!

🤖 Generated with [Claude Code](https://claude.com/claude-code)
