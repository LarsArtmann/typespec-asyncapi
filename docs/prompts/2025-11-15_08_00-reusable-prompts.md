# Reusable Prompts for TypeSpec AsyncAPI Development

**Created:** 2025-11-15
**Source Session:** Type Safety Foundation - THE 1% Execution
**Purpose:** Proven prompts that drive high-quality systematic execution

---

## 1. The Systematic Execution Prompt

**Name:** `systematic-execution-with-verification`

**When to Use:**
- Starting complex refactoring work
- Implementing new features with high quality standards
- Type safety improvements
- Architecture changes

**The Prompt:**

```
I need you to work on [TASK DESCRIPTION] with the HIGHEST possible standards:

MINDSET:
- Think like a Senior Software Architect
- Apply Domain-Driven Design (DDD) principles
- TYPE SAFETY is your #1 priority
- Make invalid states unrepresentable with strong types
- No booleans where enums/discriminated unions should be used
- Files must be <350 lines (preferably <200)
- Use established libraries instead of custom implementations

EXECUTION REQUIREMENTS:
1. Comprehensive planning BEFORE execution
2. Pareto analysis: 1% → 51% value, 4% → 64% value, 20% → 80% value
3. Create 30 comprehensive tasks (30-100min each)
4. Create 150 micro-tasks (15min each)
5. Systematic execution with git commits after each logical change
6. Execute THE 1% (highest value tasks) first

APPROACH:
READ, UNDERSTAND, RESEARCH, REFLECT.
Break this down into multiple actionable steps.
Think about them again.
Execute and Verify them one step at the time.
Repeat until done.
Keep going until everything works and you think you did a great job!

DELIVERABLES:
- Comprehensive execution plan with Pareto analysis
- Mermaid diagrams showing current vs improved architecture
- Detailed status reports after each phase
- Git commits with descriptive messages
- Full test coverage for changes
```

**Expected Output:**
- Comprehensive plan document (30+ tasks)
- Pareto analysis breakdown
- Systematic execution with frequent commits
- Type-safe, well-tested code
- Architectural improvements

**Example Usage:**
```
I need you to work on eliminating all `any` types from security-critical code with the HIGHEST possible standards:

[... rest of prompt ...]
```

---

## 2. The Comprehensive Status Update Prompt

**Name:** `comprehensive-status-request`

**When to Use:**
- After significant work sessions
- Before making major decisions
- When you need clarity on progress
- Before planning next steps

**The Prompt:**

```
FULL COMPREHENSIVE & DETAILED STATUS UPDATE! RIGHT NOW! THEN WAIT FOR INSTRUCTIONS!

INCLUDE WORK:
a) FULLY DONE - What's 100% completed and verified
b) PARTIALLY DONE - What's in progress with % complete
c) NOT STARTED - What's planned but not begun
d) TOTALLY FUCKED UP - What went wrong and why
e) WHAT WE SHOULD IMPROVE - Lessons learned and improvements
f) Top #25 things we should get done next - Prioritized with effort estimates
g) Ask your Top #1 question you can NOT figure out yourself

INCLUDE METRICS:
- Build status (TypeScript errors)
- ESLint status (errors + warnings)
- Test results (pass/fail counts)
- Files modified
- Lines of code changed
- Before/after comparisons

FORMAT:
- Use tables for metrics
- Use priority matrices (Impact vs Effort)
- Use clear sections with headers
- Include concrete examples
- Be brutally honest about mistakes
```

**Expected Output:**
- Detailed status report covering all 7 sections (a-g)
- Metrics tables showing before/after
- Priority matrix for next tasks
- Honest assessment of mistakes
- Clear question for user decision

**Example Output Structure:**
```
# COMPREHENSIVE STATUS UPDATE

## a) ✅ FULLY DONE
[Completed work with verification]

## b) 🟡 PARTIALLY DONE
[In-progress work with % complete]

## c) 🔴 NOT STARTED
[Planned work not yet begun]

## d) 💥 TOTALLY FUCKED UP
[Mistakes made and lessons learned]

## e) 💡 WHAT WE SHOULD IMPROVE
[Improvement opportunities]

## f) 🎯 TOP #25 THINGS TO GET DONE NEXT
[Prioritized task table with Impact/Effort]

## g) ❓ TOP #1 QUESTION
[Key decision or blocker]

## 📊 METRICS SUMMARY
[Before/after comparison table]
```

---

## 3. The Architecture Understanding Prompt

**Name:** `architecture-visualization-request`

**When to Use:**
- Starting work on unfamiliar codebase
- Before major refactoring
- When documenting architecture
- When onboarding team members

**The Prompt:**

```
Provide me with a mermaid.js graph on how you think the App is architected.
Do NOT do anything else! JUST the mermaid.js graph RIGHT NOW!
Write it to docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME>.mmd

Now provide me with a mermaid.js graph on how you think the App SHOULD BE architected!
Do NOT do anything else! JUST the mermaid.js graph RIGHT NOW!
Write it to docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME-improved>.mmd

Include in CURRENT architecture:
- All layers (entry, application, domain, infrastructure)
- All major services and their relationships
- Decorator system integration
- Type system structure
- Effect.TS integration
- PROBLEMS IDENTIFIED (highlighted in red/yellow)

Include in IMPROVED architecture:
- DDD principles applied (aggregates, value objects, repositories)
- Plugin architecture for extensibility
- Branded types and discriminated unions
- Effect.TS layered architecture
- Domain events
- IMPROVEMENTS ACHIEVED (highlighted in green)
```

**Expected Output:**
- Two mermaid.js diagram files
- Current architecture showing problems
- Improved architecture showing solutions
- Clear visual comparison of before/after

---

## 4. The Type Safety Foundation Prompt

**Name:** `eliminate-any-types-systematically`

**When to Use:**
- Eliminating `any` types from codebase
- Improving type safety in critical code
- Creating discriminated unions for domain models
- Adding type guards for runtime validation

**The Prompt:**

```
Eliminate all `any` types from [FILE/MODULE] using discriminated unions:

REQUIREMENTS:
1. Create complete discriminated union for all variants
2. Every field must be `readonly` for immutability
3. Implement comprehensive type guards with runtime validation
4. Use exhaustive pattern matching in switch statements
5. Make invalid states unrepresentable

STEPS:
1. Identify all `any` types in target file
2. Analyze what types they represent
3. Create discriminated union type hierarchy
4. Implement type guards for each variant
5. Replace `any` with discriminated union
6. Update all call sites to use type guards
7. Run tests to verify no regressions
8. Commit with detailed message

VALIDATION:
- Build must pass (0 TypeScript errors)
- ESLint must show improvement (fewer warnings)
- All tests must pass
- No `any` types remaining in target file
```

**Expected Output:**
- Complete discriminated union types
- Comprehensive type guards
- All `any` types eliminated
- Tests passing
- ESLint improvements

**Example Usage:**
```
Eliminate all `any` types from src/domain/decorators/security-ENHANCED.ts using discriminated unions:

[... requirements ...]
```

---

## 5. The DDD Value Object Creation Prompt

**Name:** `create-value-objects-with-validation`

**When to Use:**
- Creating domain value objects
- Replacing primitive types with rich types
- Adding validation to domain concepts
- Preventing invalid states

**The Prompt:**

```
Create value objects for [DOMAIN CONCEPT] following DDD principles:

VALUE OBJECT REQUIREMENTS:
1. Immutable (all fields readonly)
2. Self-validating (validation in constructor/factory)
3. Value equality (compare by value, not reference)
4. Type-safe (use branded types)
5. Make invalid states unrepresentable

STRUCTURE:
```typescript
// Bad (primitive obsession):
type ChannelPath = string

// Good (value object):
export type ChannelPath = string & { readonly __brand: "ChannelPath" }

export const ChannelPath = {
  create: (value: string): Result<ChannelPath, ValidationError> => {
    // Validation logic
    if (value.includes("//")) {
      return Result.fail(new ValidationError("Channel path cannot contain double slashes"))
    }
    if (!value.startsWith("/")) {
      return Result.fail(new ValidationError("Channel path must start with /"))
    }
    return Result.ok(value as ChannelPath)
  },

  equals: (a: ChannelPath, b: ChannelPath): boolean => a === b,

  toString: (path: ChannelPath): string => path
}
```

IMPLEMENTATION STEPS:
1. Identify primitive types that represent domain concepts
2. Create branded type for type safety
3. Create factory function with validation
4. Implement value equality
5. Add utility methods
6. Update codebase to use value object
7. Add comprehensive tests
```

**Expected Output:**
- Branded type definition
- Factory function with validation
- Utility methods
- Tests for valid/invalid cases
- Updated codebase using value object

---

## 6. The Quick Wins Identification Prompt

**Name:** `identify-quick-wins`

**When to Use:**
- Starting code quality improvement sessions
- Looking for low-effort, high-impact improvements
- Building momentum before big refactoring
- Demonstrating progress quickly

**The Prompt:**

```
Identify 10 quick wins for code quality improvement:

CRITERIA:
- Each fix should take <15 minutes
- Focus on ESLint warnings that are easy to fix
- Prioritize by impact (type safety > naming conventions)
- Must not break existing functionality
- Each gets its own git commit

CATEGORIES:
1. Remove unused imports
2. Fix naming conventions (Effect.TS schemas: UPPER_CASE)
3. Prefix unused variables with underscore
4. Remove unused variables entirely
5. Fix low-hanging type safety issues
6. Add missing return types
7. Fix inconsistent formatting
8. Remove commented-out code

EXECUTION:
For each quick win:
1. Identify the issue
2. Make the fix
3. Verify build passes
4. Run ESLint to confirm improvement
5. Commit with descriptive message
6. Move to next quick win

REPORTING:
After all 10 quick wins:
- Show before/after ESLint metrics
- List all commits made
- Highlight biggest improvements
- Identify remaining issues for follow-up
```

**Expected Output:**
- List of 10 specific quick wins
- 10 git commits (one per fix)
- ESLint improvement metrics
- Momentum for bigger improvements

---

## 7. The Test Investigation Prompt

**Name:** `investigate-test-failures-systematically`

**When to Use:**
- Tests are failing unexpectedly
- Test numbers fluctuate between runs
- Flaky tests need investigation
- Test suite instability

**The Prompt:**

```
Investigate test failures systematically:

CURRENT STATE:
- Test pass/fail counts
- Test number fluctuations
- Error messages from failures
- Build status (TypeScript errors)

INVESTIGATION STEPS:
1. Run tests 3 times, record pass/fail numbers
2. Identify patterns in failures
   - Same tests always fail?
   - Different tests fail each run?
   - Failures related to specific modules?
3. Check for test order dependencies
   - Run tests with --random-seed
   - Run failing tests in isolation
4. Check for shared state pollution
   - Look for missing beforeEach cleanup
   - Look for global state mutations
5. Check for async timing issues
   - Look for missing await
   - Look for Effect.runSync vs runPromise
6. Check for mock state issues
   - Look for mocks not reset between tests
   - Look for TypeSpec Program objects reused

HYPOTHESES TO TEST:
1. Test order dependency
2. Timing/race conditions
3. Mock state pollution
4. Effect.TS context issues

REPORTING:
- Document findings
- Identify root causes
- Propose fixes
- Estimate effort to fix
```

**Expected Output:**
- Root cause analysis
- Identified patterns
- Proposed fixes
- Effort estimates

---

## 8. The Learning Documentation Prompt

**Name:** `document-session-learnings`

**When to Use:**
- End of significant work session
- After making mistakes you want to learn from
- After discovering new insights
- Building institutional knowledge

**The Prompt:**

```
Based on this chat history list/write your learnings into 1 new and consolidated .md file so we can get better in the future.

Put the new .md file at docs/learnings/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md

STRUCTURE:
1. What Worked Exceptionally Well
2. What Went Wrong
3. Key Insights & Principles
4. Lessons for Future Sessions
5. Actionable Takeaways
6. Session Metrics

CONTENT REQUIREMENTS:
- Concrete examples with code snippets
- Before/after comparisons
- Honest assessment of mistakes
- Specific actionable lessons
- Metrics showing impact
- Links to relevant files/commits

Be brutally honest about:
- Mistakes made
- Why they happened
- How to prevent them
- What you learned

Format for readability:
- Use headers and subheaders
- Use code blocks for examples
- Use tables for metrics
- Use bullet points for lists
- Highlight key principles
```

**Expected Output:**
- Comprehensive learning document
- Honest mistake analysis
- Actionable principles
- Concrete examples
- Metrics showing impact

---

## 9. The Commit Message Standards Prompt

**Name:** `create-meaningful-commits`

**When to Use:**
- Before committing significant changes
- When you want clear git history
- When you need descriptive commit messages

**The Prompt:**

```
Create git commit with comprehensive message following these standards:

COMMIT MESSAGE FORMAT:
```
<type>: <short summary (50 chars max)>

<detailed description (72 chars per line)>

- What changed
- Why it changed
- Impact of change
- Breaking changes (if any)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

COMMIT TYPES:
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring (no behavior change)
- perf: Performance improvement
- test: Adding/fixing tests
- docs: Documentation changes
- chore: Maintenance tasks
- style: Code formatting (no behavior change)
- ci: CI/CD changes

REQUIREMENTS:
- Run `git status` to see changes
- Run `git diff` to see actual changes
- Analyze impact of changes
- Write clear, descriptive message
- Include motivation and context
```

**Expected Output:**
- Well-formatted commit message
- Clear description of changes
- Context and motivation
- Impact assessment

---

## 10. The Pareto Analysis Prompt

**Name:** `prioritize-with-pareto-analysis`

**When to Use:**
- Planning major improvements
- Prioritizing technical debt
- Deciding what to work on next
- Maximizing impact with limited time

**The Prompt:**

```
Create Pareto analysis for [IMPROVEMENT AREA]:

FRAMEWORK:
- THE 1% → 51% of value (highest leverage tasks)
- THE 4% → 64% of value (critical fixes)
- THE 20% → 80% of value (architecture improvements)

ANALYSIS:
For each task, calculate:
- Impact (CRITICAL/HIGH/MEDIUM/LOW)
- Effort (time estimate in minutes)
- Leverage (Impact ÷ Effort)
- Priority (sort by leverage descending)

THE 1% CRITERIA (Highest Leverage):
- Type safety improvements
- Eliminating dangerous patterns (any, split brain)
- Security-critical fixes
- Core domain modeling

THE 4% CRITERIA (Critical):
- Fixing circular dependencies
- Test stability
- Build system reliability
- Error handling improvements

THE 20% CRITERIA (Architecture):
- Code organization
- Plugin architecture
- Performance optimizations
- Documentation

OUTPUT FORMAT:
| Task | Impact | Effort | Leverage | Phase |
|------|--------|--------|----------|-------|
| Eliminate `any` types | CRITICAL | 90min | 🔥🔥🔥 | 1% |
| Fix test flakiness | HIGH | 120min | 🔥🔥 | 4% |
| Split large files | LOW | 180min | 🔥 | 20% |

RECOMMENDATION:
Start with THE 1% tasks. These provide 51% of value with 1% of effort.
```

**Expected Output:**
- Prioritized task list
- Impact/effort analysis
- Clear phase breakdown (1%, 4%, 20%)
- Recommendation on where to start

---

## Usage Examples

### Starting a Major Refactoring:
```
[Use Prompt #1: systematic-execution-with-verification]
+ [Use Prompt #3: architecture-visualization-request]
+ [Use Prompt #10: prioritize-with-pareto-analysis]
```

### After Work Session:
```
[Use Prompt #2: comprehensive-status-request]
+ [Use Prompt #8: document-session-learnings]
```

### Improving Type Safety:
```
[Use Prompt #4: eliminate-any-types-systematically]
+ [Use Prompt #5: create-value-objects-with-validation]
```

### Daily Code Quality:
```
[Use Prompt #6: identify-quick-wins]
+ [Use Prompt #9: create-meaningful-commits]
```

---

**Maintained By:** Claude Code + User Collaboration
**Last Updated:** 2025-11-15
**Status:** Active and Battle-Tested ✅
