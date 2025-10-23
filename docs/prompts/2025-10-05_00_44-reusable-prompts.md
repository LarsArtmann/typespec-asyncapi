# Reusable Prompts for TypeSpec AsyncAPI Development

**Generated:** 2025-10-05T00:44:00+0000

---

## Prompt 1: "End-to-End Smoke Test First"

**Name:** `smoke-test-first`

**When to use:** Start of any development session

**Prompt:**
```
Before we do ANY development work, let's verify the emitter works end-to-end:

1. Create a minimal TypeSpec file (basic-example.tsp) with:
   - Import @lars-artmann/typespec-asyncapi
   - One namespace
   - One model
   - One operation

2. Run: tsp compile basic-example.tsp --emit @lars-artmann/typespec-asyncapi

3. Verify output:
   - AsyncAPI file was generated
   - asyncapi version is "3.0.0"
   - channels exist
   - operations exist

If this fails, STOP and fix the emitter FIRST.
Only proceed with other work if this passes.
```

**Expected Output:**
- ✅ AsyncAPI JSON/YAML file generated
- ✅ Valid AsyncAPI 3.0 structure
- OR: 🔴 Error that needs fixing first

---

## Prompt 2: "Ghost System Hunter"

**Name:** `find-ghost-systems`

**When to use:** Before starting test fixes or refactoring

**Prompt:**
```
Search for ghost systems (code that tests non-existent functionality):

1. Find commented-out imports:
   find . -name "*.test.ts" | xargs grep "// DISABLED:\|// TODO:\|// FIXME:"

2. Find tests with no assertions:
   grep -r "it(.*=> {" test/ | xargs -I {} bash -c 'grep -L "expect\|assert" {}'

3. For each ghost system found:
   a. Does the tested code exist? YES/NO
   b. If NO: DELETE the test file
   c. If YES but imports commented: FIX or DELETE

4. List all ghost systems found with recommendation: DELETE or FIX

DO NOT fix imports for code that doesn't exist.
```

**Expected Output:**
- List of ghost test files
- Recommendation for each: DELETE or FIX
- Estimated time saved by deleting

---

## Prompt 3: "Test Utility Consolidation"

**Name:** `consolidate-test-utilities`

**When to use:** When you notice duplicate test helper functions

**Prompt:**
```
Consolidate duplicate test utilities:

1. Find all test helper files:
   find test -name "*helper*" -o -name "*util*" -o -name "*host*"

2. For each file:
   a. List exported functions
   b. Identify duplicates across files
   c. Identify which version is best (most features, clearest code)

3. Create consolidated-helpers.ts with:
   - Best version of each function
   - Clear JSDoc explaining usage
   - Exports organized by category

4. Create migration plan:
   - Which files need updating
   - Which old files can be deleted

5. Execute migration:
   - Update imports (batch of 10 files at a time)
   - Delete old files
   - Run tests after each batch

ONE WAY TO DO IT - Consolidate before scaling.
```

**Expected Output:**
- Single test utility file
- All tests using consolidated version
- Old files deleted

---

## Prompt 4: "Brutal Honesty Status Check"

**Name:** `brutal-honesty-check`

**When to use:** Before declaring work "done"

**Prompt:**
```
BRUTAL HONESTY STATUS CHECK - Answer these questions:

1. What did I forget to test?
2. What assumptions did I make?
3. What could still be broken?
4. Did I test what users actually care about?
5. Are there any ghost systems I missed?
6. Did I consolidate before scaling?
7. Is there any dead code I should delete?
8. Did I create any split-brain states?
9. Did I verify end-to-end functionality?
10. Would I trust this code in production?

For each "NO" answer:
- What needs to be fixed?
- How long will it take?
- What's the impact if I don't fix it?

DO NOT declare "done" until all answers are "YES" or risks are documented.
```

**Expected Output:**
- Honest assessment of work quality
- List of remaining risks
- Plan to mitigate risks

---

## Prompt 5: "Architecture Quality Assessment"

**Name:** `assess-architecture-quality`

**When to use:** Before merging to main branch

**Prompt:**
```
Assess architecture quality:

1. Separation of Concerns:
   - Is domain logic separate from infrastructure?
   - Are effects isolated from pure functions?

2. One Way to Do It:
   - Are there multiple ways to accomplish the same task?
   - Are test utilities consolidated?

3. Dead Code:
   - Find unused exports: ts-prune or similar
   - Find files not imported anywhere
   - Find commented-out code

4. Ghost Systems:
   - Are all tests testing real code?
   - Is all infrastructure actually used?

5. Consistency:
   - Are we using Effect.TS everywhere or nowhere?
   - Are naming conventions consistent?

6. Documentation:
   - Is the architecture documented?
   - Are decisions explained?

Create:
- Architecture diagram (current state)
- Architecture diagram (ideal state)
- Migration plan (current → ideal)
- Estimated effort

Focus on: Quality > Quantity, Consistency > Perfection
```

**Expected Output:**
- Architecture diagrams (current + ideal)
- List of quality issues
- Prioritized improvement plan

---

## Prompt 6: "Test Quality Over Quantity"

**Name:** `test-quality-audit`

**When to use:** When test suite feels bloated

**Prompt:**
```
Audit test quality:

1. For each test file:
   a. What behavior does this test guarantee?
   b. If this test fails, what broke?
   c. Is this testing implementation or behavior?
   d. Could this be tested better in an integration test?

2. Categorize tests:
   - 🟢 HIGH VALUE: Tests user-facing behavior
   - 🟡 MEDIUM VALUE: Tests important internals
   - 🔴 LOW VALUE: Tests implementation details
   - ⚫ NO VALUE: Tests nothing (ghost tests)

3. Create deletion plan:
   - Delete: NO VALUE tests
   - Consolidate: LOW VALUE tests
   - Keep: MEDIUM + HIGH VALUE tests

4. Target metrics:
   - Reduce total test count by 30-50%
   - Increase behavior test ratio to 70%+
   - Delete all implementation detail tests

Remember: 200 valuable tests > 579 mixed tests
```

**Expected Output:**
- Test categorization
- Deletion plan
- Expected test count reduction

---

## Prompt 7: "Micro-Task Breakdown"

**Name:** `break-into-micro-tasks`

**When to use:** When facing a large, overwhelming task

**Prompt:**
```
Break this task into 12-minute micro-tasks:

1. What is the end goal? (Clear, measurable)

2. Break into steps (max 12min each):
   - Each step must be completable in one sitting
   - Each step must have clear success criteria
   - Each step must not depend on future steps

3. Sort by:
   - Impact (High/Medium/Low)
   - Effort (High/Medium/Low)
   - Dependencies (Blocks what?)

4. Create execution order:
   - High Impact + Low Effort = Do first
   - Low Impact + High Effort = Do last or delete

5. For each micro-task:
   - What is the input?
   - What is the output?
   - How do I verify success?

Create a markdown table with:
| # | Task | Time | Impact | Effort | Success Criteria |

Remember: Small wins build momentum
```

**Expected Output:**
- Sorted list of 12-min tasks
- Clear success criteria for each
- Recommended execution order

---

## Prompt 8: "Document Architecture Decisions"

**Name:** `create-adr`

**When to use:** After making a significant architectural choice

**Prompt:**
```
Create Architecture Decision Record (ADR):

Title: [Decision name]
Date: [ISO date]
Status: [Proposed / Accepted / Deprecated / Superseded]

Context:
- What is the issue we're trying to solve?
- What constraints do we have?
- What alternatives did we consider?

Decision:
- What did we decide to do?
- Why this approach over alternatives?

Consequences:
- What becomes easier?
- What becomes harder?
- What technical debt might this create?
- What's the migration path if we need to change?

Save to: docs/adr/YYYY-MM-DD-decision-name.md

Examples of ADR-worthy decisions:
- Chose Effect.TS for error handling
- Chose to NOT support AsyncAPI 2.x
- Chose to delete performance testing infrastructure
```

**Expected Output:**
- ADR markdown file
- Clear rationale for decision
- Documented consequences

---

## Prompt 9: "Refactor to Railway Programming"

**Name:** `convert-to-railway`

**When to use:** Converting imperative code to Effect.TS patterns

**Prompt:**
```
Convert this code to Railway Programming with Effect.TS:

1. Identify current patterns:
   - try/catch blocks → Effect.try
   - Promise chains → Effect.gen
   - Null checks → Effect.fromNullable
   - Mutations → Pure functions returning new state

2. Create Effect.gen pipeline:
   - Each step yields an Effect
   - No early returns
   - No mutations
   - No try/catch

3. Define error types:
   - Create branded error types
   - Use Data.TaggedError for errors
   - Return Effect<Success, Error>

4. Update callers:
   - Use Effect.runPromise or runSync
   - Handle errors with catchAll
   - Chain effects with pipe

5. Test both happy path and error cases

Remember: Railway = Success track OR Error track, never both
```

**Expected Output:**
- Effect.gen pipeline
- Branded error types
- No try/catch blocks
- Tests for both tracks

---

## Prompt 10: "Session Closeout Checklist"

**Name:** `session-closeout`

**When to use:** End of development session

**Prompt:**
```
Session closeout checklist:

1. Git Status:
   - Are all changes committed?
   - Are commit messages descriptive?
   - Should I push now or wait?

2. GitHub Issues:
   - Did I close any completed issues?
   - Did I add comments to relevant issues?
   - Did I create issues for new findings?
   - Are session notes in docs/sessions/ (not issues)?

3. Documentation:
   - Did I update CLAUDE.md if workflow changed?
   - Did I create ADRs for decisions?
   - Did I document learnings?

4. Brutal Honesty:
   - What did I NOT complete?
   - What risks remain?
   - What should the next session focus on?

5. Handoff:
   - If I don't return tomorrow, what's the most important thing to know?
   - What's the #1 priority for next session?

Create session summary in docs/sessions/YYYY-MM-DD-session-name.md

DO NOT create GitHub issues for session summaries.
```

**Expected Output:**
- Session summary markdown file
- Updated/closed GitHub issues
- Clear handoff to next session

---

## Usage Examples

**Scenario 1: Starting a new session**
```bash
# Run prompt 1 first (smoke-test-first)
# Then prompt 2 (find-ghost-systems)
# Then prompt 3 if needed (consolidate-test-utilities)
```

**Scenario 2: Before declaring work done**
```bash
# Run prompt 4 (brutal-honesty-check)
# Then prompt 5 (assess-architecture-quality)
# Then prompt 10 (session-closeout)
```

**Scenario 3: Feeling overwhelmed**
```bash
# Run prompt 7 (break-into-micro-tasks)
# Focus on top 3 high-impact, low-effort tasks
# Use prompt 10 after each task to track progress
```

---

## Prompt Combinations

**"Quality Gates" - Run before merging:**
1. smoke-test-first
2. find-ghost-systems
3. brutal-honesty-check
4. assess-architecture-quality

**"Fresh Start" - Run at beginning of session:**
1. smoke-test-first
2. find-ghost-systems
3. consolidate-test-utilities (if needed)

**"Overwhelmed Response" - When stuck:**
1. brutal-honesty-check
2. break-into-micro-tasks
3. Focus on task #1 only

**"Session End" - Run before closing:**
1. brutal-honesty-check
2. session-closeout

---

## Meta-Prompt: Create New Prompts

**When you encounter a repeated pattern, create a new prompt:**

```
I notice I keep doing [X] manually. Create a reusable prompt:

1. What is the trigger for this work?
2. What are the steps?
3. What is the expected output?
4. How do I verify success?
5. What mistakes should be avoided?

Format as markdown, save to docs/prompts/
```

**Growing the prompt library makes future work faster!**
