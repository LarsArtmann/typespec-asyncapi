# Alpha v0.1.0 Release Criteria

**Target:** Minimal viable AsyncAPI emitter that generates VALID AsyncAPI 3.0 specifications

## ✅ MUST HAVE (Blocking)

### Core Functionality
- [ ] **TypeSpec Compilation Works** - `npx tsp compile example.tsp --emit @larsartmann/typespec-asyncapi` succeeds
- [ ] **Generates Valid AsyncAPI 3.0** - Output passes `@asyncapi/parser` validation
- [ ] **Basic Decorators Work** - `@channel`, `@publish`, `@subscribe` functional
- [ ] **Clean Build** - `just build` succeeds with zero TypeScript errors
- [ ] **Zero ESLint Errors** - `just lint` passes without errors
- [ ] **Package Exports Correct** - Can be installed and imported as npm package

### Minimum AsyncAPI Features
- [ ] **Channels** - Can define message channels with `@channel("path")`
- [ ] **Operations** - Can define publish/subscribe operations
- [ ] **Messages** - Basic message schema generation from TypeSpec models
- [ ] **Info Object** - Valid AsyncAPI info section (title, version, description)
- [ ] **Components/Schemas** - TypeSpec models → AsyncAPI schemas

### Output Formats
- [ ] **YAML Output** - Default `asyncapi.yaml` generation
- [ ] **JSON Output** - Optional `--file-type json` support
- [ ] **File Naming** - Custom `--output-file` support

## ⚠️ NICE TO HAVE (Non-blocking)

### Advanced Features
- [ ] Protocol bindings (`@protocol`)
- [ ] Security schemes (`@security`) 
- [ ] Server definitions (`@server`)
- [ ] Message metadata (`@message`)
- [ ] Documentation preservation from TypeSpec `@doc`

### Quality
- [ ] Test suite >70% passing
- [ ] Performance benchmarks
- [ ] Comprehensive documentation

## 🚫 OUT OF SCOPE (v0.1.0)

- Versioning support (`@typespec/versioning`)
- Complex AsyncAPI 3.0 features (correlationId, headers, etc.)
- Multiple servers/environments
- OpenAPI interoperability

## 📝 VALIDATION CHECKLIST

### Manual Validation
```bash
# 1. Clean build
just clean && just build

# 2. Lint check
just lint

# 3. Create test TypeSpec file
cat > test-alpha.tsp << 'EOF'
import "@larsartmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestService;

model UserEvent {
  userId: string;
  action: "signup" | "login" | "logout";
  timestamp: utcDateTime;
}

@channel("user.events")
@publish
op publishUserEvent(): UserEvent;
EOF

# 4. Compile with emitter
npx tsp compile test-alpha.tsp --emit @larsartmann/typespec-asyncapi

# 5. Validate AsyncAPI output
npx @asyncapi/parser validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml
```

### Expected Output Structure
```yaml
asyncapi: 3.0.0
info:
  title: TestService
  version: 1.0.0
channels:
  user.events:
    # Channel definition
operations:
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/user.events'
components:
  schemas:
    UserEvent:
      type: object
      properties:
        userId:
          type: string
        # ... etc
```

## 🎯 SUCCESS CRITERIA

**Alpha v0.1.0 is READY when:**
1. Manual validation checklist passes 100%
2. Generated AsyncAPI validates against AsyncAPI 3.0 schema
3. Can be consumed by AsyncAPI tools (Studio, Generator)
4. Package can be installed via npm/bun
5. Zero critical bugs in core functionality

**Timeline:** Target within 2-4 hours from current state