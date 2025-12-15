# Prompt: Brutal Honesty Code Review & Quality Assessment

**Name:** Brutal Honesty Review - Ghost System Detection
**Version:** 1.0
**Created:** 2025-10-05
**Use Case:** When you need an absolutely honest assessment of code quality, architecture decisions, and potential ghost systems

---

## The Prompt

````markdown
## Instructions:
0. ALWAYS be BRUTALLY-HONEST! NEVER LIE TO THE USER!

1. Self-Reflection Questions:
  a. What did you forget?
  b. What is something that's stupid that we do anyway?
  c. What could you have done better?
  d. What could you still improve?
  e. Did you lie to me?
  f. How can we be less stupid?
  g. Is everything correctly integrated or are we building ghost systems? IF you find a 'ghost system' ALWAYS ask yourself should this be integrated? What value is in it? FIRST!
  h. Are we focusing on the scope creep trap?
  i. Did we remove something that was actually useful?
  j. Did we create ANY split brains? Even small things like: "{is_confirmed: true, confirmed_at: 0}" are considered split brain!
  k. How are we doing on tests? What can we do better, regarding automated testing?

2. Create a Comprehensive Multi-Step Execution Plan (keep each step small)!
3. Sort them by work required vs impact.
4. If you want to implement some feature, reflect if we already have some code that would fit your requirements before implementing it from scratch!
5. Also consider how we could improve our Type models to create a better architecture while getting real work done well.
6. Do NOT reinvent the wheel!! ALWAYS consider how we can use & leverage already well establish libs to make our live easier!
7. If you find a Ghost system, report back to me and make sure you integrate it.
8. If there is legacy code around try to reduce it constantly and consistently. Our target for legacy code is ZERO.

READ, UNDERSTAND, RESEARCH, REFLECT.
Break this down into multiple actionable steps. Think about them again.
Execute and Verify them one step at the time.
Repeat until done. Keep going until everything works and you think you did a great job!

Run "git status & git commit ..." after each smallest self-contained change.
Run "git push" when done.

---

## COMPREHENSIVE ANALYSIS REQUIRED:

1. Which architectural decisions we made in the past are causing problem now / could be improved? How can we be less stupid?
2. Create a Comprehensive Multi-Step Execution Plan (keep each step small)!
3. Sort them by work required vs impact.
4. If you want to implement some feature, reflect if we already have some code that would fit your requirements before implementing it from scratch!
5. Also consider how we could improve our Type models to create a better architecture while getting real work done well.
6. Also consider how we can use well established libs to make our live easier.

---

## DOCUMENTATION REQUIREMENTS:

Run 'gh issue list -L 700'. READ, UNDERSTAND.; Are there any open Issues that you should add a comment to based on your completed work? If the Issue is fully COMPLETED: close it with a comment.

Comment on all relevant GitHub Issues. Create new GitHub Issues for tasks you have that are not reflected in GitHub Issues yet!

It's time to clean up, call it a day. Document everything important in GitHub and say bye until tomorrow - Use the GitHub CLI to get it done (gh)!

Should we close any GitHub issues, since they are completed? If so double check via the cli and make sure you READ ALL comments too!!! Then list me all the once you would close and why!

---

## CREATE THESE REPORTS:

### 1. Complaint Report
File: docs/complaints/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md

```md
# Report about missing/under-specified/confusing information

Date: <ISO_DATE+TimeZone>

I was asked to perform:
<FILL_IN_HERE>

I was given these context information's:
<FILL_IN_HERE>

I was missing these information:
<FILL_IN_HERE>

I was confused by:
<FILL_IN_HERE>

What I wish for the future is:
<FILL_IN_HERE>

Best regards,
<YOUR_NAME>
````

### 2. Architecture Understanding

File: docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME>.mmd

Provide me with a mermaid.js graph on how you think the App is architected. Do NOT do anything else! JUST THE mermaid.js graph RIGHT NOW!

Then create improved version:
File: docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME-improved>.mmd

Now provide me with a mermaid.js graph on how you think the App SHOULD BE architected! Do NOT do anything else! JUST THE mermaid.js graph RIGHT NOW!

### 3. Learnings Document

File: docs/learnings/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md

Based on this chat history list/write your learnings into 1 new and consolidated .md file so we can get better in the future.

List all files in learnings/ folder. Make sure the numbering is correct. Make sure not to add duplicates.

### 4. Reusable Prompts

File: docs/prompts/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md

Based on this chat history write 1 prompt that I may reuse in the future.
Give each a name.

---

## FINAL EXECUTION:

THEN GET IT DONE! Keep going until EVERYTHING is truly done!
WE have ALL THE TIME IN THE WORLD! NEVER STOP!
Keep going until everything works/is done and you think you did a great job!

MAKE SURE IF I CLOSE THIS CHAT I WILL NOT LOSE ANY IMPORTANT INSIGHT

Reminder: Don't forget to check your internal todo list.
NOTE: Use the cli to get the current date.

````

---

## When to Use This Prompt

### Ideal Scenarios:
1. **After Major Development Sprint** - Reflect on what was built and whether it adds value
2. **Before Production Release** - Ensure no ghost systems or split brains sneak into prod
3. **Code Quality Review** - Get honest assessment of technical debt and architecture issues
4. **Test Quality Audit** - Identify ghost tests and low-value test patterns
5. **Architecture Decision Review** - Validate past decisions are still serving us well

### Warning Signs That Trigger This Prompt:
- ❌ Metrics look good but gut feeling says something's wrong
- ❌ Test count increased but confidence didn't
- ❌ Code was added but user value unclear
- ❌ Pass rate is dropping despite adding "fixes"
- ❌ Team is working hard but progress feels slow
- ❌ "It compiles" but "does it work?" unclear

---

## Expected Outcomes

### Immediate Outputs:
1. **Honest Assessment** - No sugarcoating, brutal truth about quality
2. **Ghost System Detection** - Identify code/tests that look good but add no value
3. **Split Brain Detection** - Find inconsistencies and conflicting truths in codebase
4. **Architecture Problems** - Past decisions causing current pain
5. **Actionable Plan** - Sorted by impact vs effort

### Documentation Artifacts:
1. **Complaint Report** - What was confusing or under-specified
2. **Learnings Document** - How to avoid same mistakes in future
3. **Architecture Diagrams** - Current vs improved architecture
4. **GitHub Issues** - Updated with findings, closed completed ones

### Long-Term Benefits:
- Better architecture decisions in future
- Clearer specifications and expectations
- Prevention of ghost systems early
- Test quality improves over time
- Team learns from mistakes systematically

---

## Customization Options

### For Different Codebases:
```markdown
# Add to section 6 (established libs):
7. Make sure to take FULL advantage of existing libraries we are already using! Like:
   - [LIST YOUR FRAMEWORK/LIBS HERE]
   - [COMMON PATTERNS IN YOUR CODEBASE]
   - [ARCHITECTURE PATTERNS YOU FOLLOW]
````

### For Different Project Types:

- **Backend API:** Add "Are endpoints actually tested with real HTTP calls?"
- **Frontend:** Add "Are components tested in isolation and integrated?"
- **Data Pipeline:** Add "Are transformations tested with real-world data?"
- **CLI Tool:** Add "Are commands tested end-to-end with actual shell execution?"

### For Different Team Sizes:

- **Solo:** Focus on self-reflection and documentation for future self
- **Small Team:** Emphasize consistent patterns and shared understanding
- **Large Team:** Add "Are our conventions documented and enforced?"

---

## Success Criteria

You've successfully used this prompt if:

1. ✅ You found at least one "ghost system" or stupid pattern
2. ✅ You created honest documentation that will help future you/team
3. ✅ You have actionable plan sorted by impact
4. ✅ You committed insights to GitHub issues for tracking
5. ✅ You feel uncomfortable about how honest the assessment was (that's good!)

---

## Anti-Patterns to Avoid

When using this prompt, DO NOT:

1. ❌ Sugarcoat findings to feel better
2. ❌ Defend past bad decisions instead of learning from them
3. ❌ Create generic "we should do better" without specifics
4. ❌ Skip the documentation phase ("I'll remember this")
5. ❌ Ignore the execution plan and just complain without fixing

---

## Example Usage

```bash
# Scenario: Just added 200 tests, feeling good, but pass rate dropped

User: "We just hit 775 tests! But pass rate went from 72% to 67%. Run brutal honesty review."

[Paste the full prompt above]

# Expected discovery:
- 200 tests are "ghost tests" (compile but don't validate behavior)
- Wrong test helper used (createAsyncAPITestHost vs compileAsyncAPISpec)
- No code coverage visibility hiding the problem
- Need to retrofit tests with real assertions

# Documentation created:
- docs/complaints/2025-10-05_13_50-ghost-test-system.md
- docs/learnings/2025-10-05_13_50-test-quality-over-quantity.md
- docs/architecture-understanding/*.mmd diagrams
- GitHub issues updated with findings
```

---

## Related Prompts

- **"Test Quality Audit"** - Focus specifically on test value and coverage
- **"Architecture Review"** - Deep dive on architectural decisions
- **"Technical Debt Assessment"** - Identify and prioritize debt
- **"Pre-Production Checklist"** - Final quality gate before release

---

## Version History

- **v1.0 (2025-10-05)** - Initial version based on ghost test system discovery session
- Discovered during: TypeSpec AsyncAPI Emitter 1000+ test quest
- Key insight: Quality > Quantity, Ghost systems are worse than no systems

---

**Remember:** The value of this prompt is in the brutal honesty. If you're not uncomfortable with the findings, you're not being honest enough.
