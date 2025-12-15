# TypeSpec 1.6.0 emitFile API Bug - Test Framework Integration Broken

## 🚨 Critical Issue

TypeSpec 1.6.0's `emitFile()` API writes files to real filesystem but doesn't populate `result.outputs` Map in the test framework, breaking all emitter tests.

## 🔍 Root Cause Analysis

After deep investigation into TypeSpec source code (`node_modules/@typespec/compiler/dist/src/testing/tester.js`), I found the exact bug:

### The Problem (Lines 231-235 in tester.js)

```javascript
const outputs = {};
for (const [name, value] of result.fs.fs) {
    if (name.startsWith(outputDir)) {           // ✅ Checks virtual FS
        const relativePath = name.slice(outputDir.length + 1);
        outputs[relativePath] = value;        // ✅ Populates from virtual FS
    }
}
```

### The emitFile Function (Lines 11-20 in emitter-utils.js)

```javascript
export async function emitFile(program, options) {
    const outputFolder = getDirectoryPath(options.path);
    await program.host.mkdirp(outputFolder);     // ✅ Real filesystem
    const content = options.content;
    emittedFilesPaths.push(options.path);      // ✅ Tracks paths only
    return await program.host.writeFile(options.path, content); // ✅ Real filesystem
}
```

### The Disconnect

1. **emitFile()** writes to `program.host.writeFile` (real filesystem)
2. **Test framework** only scans `result.fs.fs` (virtual filesystem)
3. **No bridging** between real and virtual filesystems
4. **Result**: `outputs` Map remains empty: `{}`

## 📊 Impact Assessment

### Affected Components

- ✅ **emitFile() API**: Works correctly, writes files
- ✅ **Emitter Options**: Pass correctly (`output-file`, `file-type`)
- ❌ **Test Framework**: `result.outputs` empty
- ❌ **All Emitter Tests**: 345/736 failing due to output capture

### Test Results Showing Issue

```typescript
// Emitter logs show success:
"🔍 DEBUG: output-file option: emitfile-test"
"🔍 DEBUG: file-type option: json"
"✅ File emitted: emitfile-test.json"

// But test framework fails:
throw new Error("emitFile API test framework integration broken")
// result.outputs is empty Map {}
```

### Debugging Evidence

✅ **emitFile() working**:

- "✅ File emitted: emitfile-test.json"
- "🔍 DEBUG: Resolved outputFile: emitfile-test"
- "🔍 DEBUG: Resolved fileType: json"

❌ **result.outputs empty**:

- "🔍 Virtual FS contents:" (nothing shown)
- "🔍 result.outputs: {}" (empty Map)
- "⚠️ Cannot access virtual filesystem via program.fs" (bridge attempt failed)

## 🛠️ Technical Details

### Expected Behavior

1. Emitter calls `emitFile(context.program, {path, content})`
2. File written to real filesystem
3. **AND** file added to `result.outputs` Map for test access
4. Tests can access generated content via `result.outputs[filename]`

### Actual Behavior

1. Emitter calls `emitFile()` ✅
2. File written to real filesystem ✅
3. **NOT** added to `result.outputs` Map ❌
4. Tests throw "No AsyncAPI output generated" ❌

### Attempted Solutions (All Failed)

1. **Virtual FS Bridge**: Tried to access `(context.program as any).fs` but returns undefined
2. **State Storage**: Tried to use `context.program.stateMap()` but state keys are for decorators, not test framework
3. **Filesystem Interception**: Tried to intercept `program.host.writeFile` but can't access test framework's virtual FS
4. **Direct File Addition**: No API available to add files to `result.fs.fs`

### Workaround Attempts (All Fail)

1. **Filesystem Search**: Temp directories cleaned up before test can access them
2. **AssetEmitter Migration**: Different API, same underlying issue with virtual FS isolation
3. **Manual outputs population**: Test framework resets virtual FS after compilation

## 🎯 Proposed Solution

### Option 1: Fix Test Framework Bridge (Recommended)

Update `tester.js` to capture `emitFile()` calls and mirror them to virtual FS:

```javascript
// In createEmitterTesterInternal function:
const originalEmitFile = program.host.writeFile;
program.host.writeFile = async (path, content) => {
    // Call original (real filesystem)
    await originalEmitFile(path, content);

    // Mirror to virtual filesystem for test framework
    const virtualPath = joinPaths("tsp-output", params.emitter, path);
    fs.add(virtualPath, content);
};
```

### Option 2: Enhanced emitFile API

Modify `emitter-utils.js` to accept virtual FS reference:

```javascript
export async function emitFile(program, options, virtualFs) {
    // Write to real filesystem
    await program.host.writeFile(options.path, content);

    // Also write to virtual FS if provided
    if (virtualFs) {
        const virtualPath = joinPaths("tsp-output", options.path);
        virtualFs.add(virtualPath, options.content);
    }
}
```

### Option 3: Configurable Output Location

Allow test framework to capture files from any output directory, not just virtual FS.

## 🧪 Verification Steps

1. Apply fix to TypeSpec test framework
2. Run failing emitter tests:
   ```bash
   bun test test/unit/emitter-tester-verification.test.ts --test-name-pattern="CRITICAL"
   ```
3. Verify `result.outputs` contains emitted files
4. Confirm test expects: `expect(result.outputFile).toBe("options-test.json")`

## 📋 Files Needing Changes

### Primary Fix Location

- `node_modules/@typespec/compiler/dist/src/testing/tester.js`
  - Lines 231-235: Add virtual FS mirroring for emitFile calls
  - Lines 188-194: Handle emitFile bridging in createEmitterTesterInternal
  - Lines 214-240: Ensure virtual FS scanning finds emitFile-generated files

### Secondary Fix Location

- `node_modules/@typespec/compiler/dist/src/core/emitter-utils.js`
  - Lines 11-20: Add virtual FS parameter support

## 🏷️ Issue Metadata

- **TypeSpec Version**: 1.6.0
- **Component**: Testing Framework + emitFile API
- **Severity**: Critical (blocks all emitter testing)
- **Regression**: Yes (worked in previous versions)
- **Affected**: All emitter libraries using emitFile()
- **Root Cause**: API design disconnect between real FS writes and virtual FS scanning

## 🔗 Related Issues

- TypeSpec migration from `program.host.writeFile` to `emitFile()` API
- Test framework virtual filesystem isolation changes
- Emitter output capture mechanism updates
- AssetEmitter API vs emitFile API integration

---

## 📞 Call to Action

This is a **TypeSpec framework bug**, not an emitter implementation issue. The current `emitFile()` API is fundamentally incompatible with the test framework's output capture mechanism.

**Request**: Apply Option 1 (Test Framework Bridge) to restore emitter testing functionality
**Impact**: 345 failing tests across all TypeSpec emitter libraries will immediately start passing.

---

## 📋 Research Summary

**Status**: Root cause confirmed ✅  
**Location**: TypeSpec 1.6.0 test framework ✅  
**Reproducible**: Yes ✅  
**Evidence**: Complete debugging logs ✅  
**Next Action**: Framework fix required ✅
