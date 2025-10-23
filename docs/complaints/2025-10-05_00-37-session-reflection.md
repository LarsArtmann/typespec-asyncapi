# Report about missing/under-specified/confusing information

Date: 2025-10-05T00:37:09Z

## I was asked to perform:

1. Fix "90 failing test imports" from previous session
2. Organize GitHub issues into milestones/projects
3. Identify duplicate issues and merge them
4. Create comprehensive execution plan sorted by impact/effort
5. Add 25+ domain/behavior tests
6. Research existing libraries to avoid reinventing the wheel
7. Document architecture decisions causing problems
8. Identify ghost systems and split brains
9. Create architecture diagrams (current + desired)
10. Document learnings and create reusable prompts
11. Commit after each change, push when done

## I was given these context information's:

1. **Previous session summary** stating "90 test failures are import path issues"
2. **GitHub issues** #110, #111, #114, #119, #120, #121, #122, #123, #124, #125
3. **Test status** mentioned as "270/361 passing" in previous session
4. **ESLint status** - Clean (0 errors, 0 warnings) from previous work
5. **Build status** - Clean (442 files compiled)

## I was missing these information:

1. **ACTUAL test output** - Should have run `bun test` FIRST before any analysis
2. **What tests are actually failing and WHY** - Assumptions were wrong
3. **What @typespec/compiler/testing provides** - Could have avoided duplicate work
4. **What @asyncapi/parser provides** - Already had validation tools
5. **Current vs desired architecture** - No diagrams or architecture documentation
6. **Which architectural decisions are causing problems now** - No historical context
7. **Definition of "ghost system"** - Had to infer from context

## I was confused by:

1. **"90 failing tests are import path issues"** - This was COMPLETELY WRONG
   - Reality: 175 failing tests with 4 different root causes
   - NO import path issues found
   - Tests ARE running, just failing for other reasons

2. **"Alpha emitter fallback logic"** - 200+ lines of code to create fake AsyncAPI documents
   - Confused about whether emitter works or not
   - Tests pass with fake data, hiding real bugs
   - Unclear if this is temporary or permanent

3. **Duplicate GitHub issues** - Found #119, #120, #123, #124, #125 all documenting same work
   - Confused about which issue is source of truth
   - Wasted time reading all duplicates

4. **Test utilities bloat** - 1096 lines in test-helpers.ts with TODOs saying "split this file"
   - Confused about whether to refactor or use as-is
   - Unclear if framework provides these utilities

5. **Scope creep** - Started with "fix tests", expanded to "organize issues", now "create architecture diagrams"
   - Confused about actual priority
   - Haven't fixed a single test yet

## What I wish for the future is:

### 1. **Test-First Workflow**
```bash
# ALWAYS start with this
bun test 2>&1 | tee /tmp/test-output.txt
grep -E "(pass|fail|error)" /tmp/test-output.txt | tail -5
```

**Wish:** Clear instruction to run tests BEFORE any analysis or planning

### 2. **Architecture Documentation**
```
docs/architecture/
  ├── current-state.mmd (mermaid diagram)
  ├── desired-state.mmd (mermaid diagram)
  ├── decisions.md (ADR format)
  └── problems.md (known issues with current architecture)
```

**Wish:** Existing architecture documentation to reference

### 3. **Ghost System Definition**
**Wish:** Clear definition upfront:
> "Ghost system: Code that duplicates existing framework/library functionality, or creates fake data to hide real bugs"

### 4. **Priority Framework**
**Wish:** Clear priority when multiple tasks given:
```
Priority 1 (CRITICAL): Fix failing tests
Priority 2 (HIGH): Add missing tests
Priority 3 (MEDIUM): Refactor/cleanup
Priority 4 (LOW): Documentation
```

### 5. **Dependency Research Checklist**
**Wish:** Standard research steps before implementing:
```
Before creating custom utilities:
☐ Check if @typespec/compiler/testing provides it
☐ Check if @asyncapi/parser provides it
☐ Check if Effect.TS provides it
☐ Search npm for "[feature] asyncapi" or "[feature] typespec"
☐ Document decision if still need custom implementation
```

### 6. **Commit Discipline Template**
**Wish:** Explicit commit template after each change:
```bash
# After EVERY code change
git status
git add <files>
git commit -m "<type>(<scope>): <description>

- What changed: <details>
- Why: <reason>
- Impact: <test results before/after>

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin <branch>
```

### 7. **Session Scope Contract**
**Wish:** Upfront agreement on scope:
```
Session Goal: [Fix 175 failing tests]
Success Criteria: [80%+ pass rate]
Out of Scope: [Architecture diagrams, documentation, refactoring]
Time Box: [4 hours]
```

### 8. **Truth Source for Test Status**
**Wish:** Single source of truth for metrics:
```
docs/metrics/
  └── test-status.md (updated automatically after each test run)
```

Instead of conflicting numbers in multiple GitHub issues

### 9. **Library Inventory**
**Wish:** Documented list of what each dependency provides:
```
docs/dependencies.md

@typespec/compiler/testing:
  - createTestHost() - ✅ Use this
  - createTestLibrary() - ✅ Use this
  - createTester() - ⚠️ Modern API, consider migrating

@asyncapi/parser:
  - Parser.parse() - ✅ Use for validation
  - AsyncAPIDocumentInterface - ✅ Use for type safety
```

### 10. **Incremental Progress Tracking**
**Wish:** Visible progress during long sessions:
```
Session Progress:
☑ Run tests (407/580 passing)
☑ Identify root causes (4 found)
☐ Fix plugin tests (0/5 done)
☐ Fix schema tests (0/5 done)
☐ Fix path tests (0/10 done)
☐ Fix ValidationService (0/20 done)
```

## Summary

The main confusion came from **WRONG ASSUMPTIONS** in the previous session that I trusted without verification:
- "90 failing tests" → Actually 175
- "Import path issues" → Actually architectural issues
- No tests running → Tests ARE running

**Root Cause:** Didn't run tests first to verify claims.

**Lesson:** ALWAYS verify with actual data before planning.

**Wish:** Clear instruction to "Run tests FIRST, analyze output, THEN plan" would have saved 2+ hours of incorrect analysis.


Best regards,
Claude (Sonnet 4.5)
