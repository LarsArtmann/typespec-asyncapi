# Brutal Honesty Audit and Execution Planning Prompt

**Name**: `brutal-honesty-audit-and-execution-planning`  
**Use Case**: When you need honest assessment, ghost system detection, and actionable execution plans  
**Session Source**: Duplication elimination and documentation organization session

## The Prompt

````markdown
## Instructions:
0. ALWAYS be BRUTALLY-HONEST! NEVER LIE TO THE USER!
1.
  a. What did you forget?
  b. What is something that's stupid that we do anyway?
  c. What could you have done better?
  d. What could you still improve?
  e. Did you lie to me?
  f. How can we be less stupid?
  g. Is everything correctly integrated or are we building ghost systems? IF you find a 'ghost system' ALLWAYS ask yourself should this be integrated? What value is in it? FIRST!
  h. Are we focusing on the scope creep trap?
  j. Did we remove something that was actually useful?
  k. Did we create ANY split brains? Event small things like: "{is_confirmed: true, confirmed_at: 0}" are considered split brain!
2. Create a Comprehensive Multi-Step Execution Plan (keep each step small)!
3. Sort them by work required vs impact.
4. If you want to implement some feature, reflect if we already have some code that would fit your requirements before implementing it from scratch!
5. Also consider how we could improve our Type models to create a better architecture while getting real work done well.
6. Do NOT reinvent the wheel!! ALWAYS consider how we can use & leverage already well establish libs to make our live easier!
7. If you find a Ghost system, report back to me and make sure you integrate it.
8. If there is legacy code around try to reduce it constantly and consistently. Our target for legacy code is 0.

READ, UNDERSTAND, RESEARCH, REFLECT.
Break this down into multiple actionable steps. Think about them again.
Execute and Verify them one step at the time.
Repeat until done. Keep going until everything works and you think you did a great job!

Run "git status & git commit ..." after each smallest self-contained change.
Run "git push" when done.
---
1. Which architectural decisions we made in the past are causing problem now / could be improved? How can we be less stupid?
2. Create a Comprehensive Multi-Step Execution Plan (keep each step small)!
3. Sort them by work required vs impact.
4. If you want to implement some feature, reflect if we already have some code that would fit your requirements before implementing it from scratch!
5. Also consider how we could improve our Type models to create a better architecture while getting real work done well.
6. Also consider how we can use well established libs to make our live easier.
7. Make sure to take FULL advantage of existing libraries we are already using! Like: TypeSpec definitions. For go-projects this should include: gin-gonic/gin (HTTP Server), spf13/viper (Configs), a-h/templ (All HTML components), bigskysoftware/htmx (Client Side Code), fe3dback/go-arch-lint (Architecture Enforcement), samber/lo (is a Lodash-style Go library based on Go 1.18+ Generics.), samber/mo (brings monads and popular FP abstractions to Go projects. ), samber/do (Dependency Injection), sqlc-dev/sqlc (ALL SQL code), onsi/ginkgo (for tests), charmbracelet/fang (library for batteries-included spf13/cobra apps), OpenTelemetry (OTEL), and our custom UserFriendlyError's lib LarsArtmann/uniflow!
8. Respect all common architecture patterns we follow: Separation of concerns, Event-Sourcing, Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), Composition over inheritance, General and Advanced Functional Programming Patterns, Layered Architecture (N-Tier Architecture), Event-Driven Architecture (EDA), Railway Oriented Programming, Behavior-driven development (BDD), Test Driven Development (TDD), "one way to do it" principle, and more...
9. If you need more information on how a lib works try: https://context7.com/[REPO_OWNER]/[REPO_NAME]/llms.txt?tokens=100000 - they have great docs!

Run "git status & git commit ..." after each smallest self-contained change.
Run "git push" when done.
---
How does your work contribute to creating customer value?
git status & git diff(s) & git commit <-- with VERY DETAILED commit message(s) & git push
---
MAKE SURE TO CREATE A VERY COMPREHENSIVE PLAN FIRST!
Split the TODOs into to small tasks 30min to 100min each (up to 24 tasks total)! It should include ALL TODOS! UNDERSTAND???!
Sort all by importance/impact/effort/customer-value.
REPORT BACK WITH A TABLE VIEW WHEN DONE!

THEN BREAK DOWN THE VERY COMPREHENSIVE & DETAILED PLAN INTO EVEN SMALLER TODOs!
EACH tasks max 12min each (up to 60 tasks total)! It should include ALL TODOS! UNDERSTAND???!
Sort all by importance/impact/effort/customer-value.
REPORT BACK WITH A TABLE VIEW WHEN DONE!
---
Run 'gh issue list -L 700'. READ, UNDERSTAND.; Are there any open Issues that you should add a comment to based on your completed work? If the Issue is fully COMPLETED: close it with a comment.
Comment on all relevant GitHub Issues. Create new GitHub Issues for tasks you have that are not reflected in GitHub Issues yet!

It's time to clean up, call it a day. Document everything important in GitHub and say bye until tomorrow - Use the GitHub CLI to get it done (gh)!
---
Should we close any GitHub issues, since they are completed? If so double check via the cli and make sure you READ ALL comments too!!! Then list me all the once you would close and why!
---
AFTER YOU REFLECTED and created the sorted VERY COMPREHENSIVE todo list, focus ONLY on the GitHub Issues!!!

MAKE SURE IF I CLOSE THIS CHAT I WILL NOT LOSE ANY IMPORTANT INSIGHT
------
Reminder: Don't forget to check your internal todo list.
NOTE: Use the cli to get the current date.
---
!------!
File a report: Where there ANY under-specified or confusing information?
Did you not know what to do at any point in time?

Here is the Form:
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

To submit the report, create a file in docs/complaints/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md
!------!

---

Based on this chat history list/write your learnings into 1 new and consolidated .md file so we can get better in the future.
Put the new .md file at docs/learnings/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md
List all files in learnings/ folder. Make sure the numbering is correct. Make sure not to add duplicates.

---

Based on this chat history write 1 prompt that I may reuse in the future.
Give each a name.
Put each of them into a new .md file at docs/prompts/<YYYY-MM-DD_HH_MM-SESSION_NAME>.md

---

Provide me with a mermaid.js graph on how you think the App is architected. Do NOT do anything else! JUST THE mermaid.js graph RIGHT NOW! Write it to docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME>.mmd

Now provide me with a mermaid.js graph on how you think the App SHOULD BE architected! Do NOT do anything else! JUST THE mermaid.js graph RIGHT NOW! Write it to docs/architecture-understanding/<YYYY-MM-DD_HH_MM-SESSION_NAME-improved>.mmd

```

## When to Use This Prompt

### ✅ Good Situations:
- **Code quality audit needed** - When you suspect problems but need honest assessment
- **Ghost system detection** - When systems feel disconnected or over-engineered
- **Scope creep concerns** - When project feels unfocused or feature-heavy
- **Technical debt cleanup** - When you need brutal honesty about what's actually broken
- **Architecture decision points** - When you need to validate if current approach is working
- **Split-brain system detection** - When multiple systems seem to do the same thing

### ❌ Avoid Using When:
- **Simple feature requests** - This prompt is overkill for straightforward implementation
- **Early prototyping** - Honesty audit is premature when exploring concepts
- **User-facing work** - This prompt focuses on internal architecture, not user features
- **Emergency fixes** - This is reflection work, not crisis response

## Expected Outcomes

### Brutal Honesty Assessment:
- **Concrete identification** of ghost systems and split brains
- **Specific anti-patterns** with measurable impact
- **Honest acknowledgment** of lies, assumptions, and marketing language
- **Clear scope creep identification** with corrective actions

### Execution Plans:
- **Two-tier planning**: 30-100min tasks broken into 12min micro-tasks
- **Impact/effort matrix sorting** for prioritization
- **Business value focus** over perfectionist organization
- **Reuse-first mindset** leveraging existing libraries and patterns

### Documentation & Knowledge Capture:
- **Complaints report** identifying confusion and missing information
- **Learnings consolidation** with reusable patterns and anti-patterns
- **Architecture diagrams** showing current vs improved state
- **GitHub issue management** with honest progress updates

## Success Metrics

After using this prompt, you should have:
- [ ] Identified and documented at least 3 specific problems (not assumptions)
- [ ] Created actionable execution plan with <60 micro-tasks
- [ ] Updated relevant GitHub issues with honest progress
- [ ] Generated complaints/learnings/architecture documentation
- [ ] Eliminated or integrated at least 1 ghost system
- [ ] Reduced scope creep to <20% of total effort

## Related Files
- Example session: Duplication elimination → documentation organization scope creep
- Previous prompt: `2025-09-05_06_00-EFFECT_TS_MIGRATION.md`
- Learning outcomes: `docs/learnings/2025-09-06_03-50_duplication-elimination-vs-documentation-organization.md`
```
