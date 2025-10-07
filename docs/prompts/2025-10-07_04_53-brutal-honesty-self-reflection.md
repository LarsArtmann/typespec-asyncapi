# Reusable Prompt: Brutal Honesty Self-Reflection

**Name:** Brutal Honesty Pre-Work Reflection
**Use Case:** Before diving into any "quick fix" or starting investigative work
**Prevents:** Scope creep, ghost system creation, wasted effort on wrong problems

---

## The Prompt

Before you start working on any task, answer these questions with BRUTAL HONESTY:

### 1. What's The REAL Problem?
- What am I ACTUALLY trying to solve?
- Is this the ROOT CAUSE or just a SYMPTOM?
- Have I verified this is still a problem (not cached/stale data)?

### 2. Is This A Ghost System?
- Does this elaborate code work around a simpler problem?
- Is there a TODO comment nearby saying "this doesn't work"?
- Am I about to add MORE complexity to a broken foundation?

### 3. Should I Even Be Doing This?
- What did yesterday's summary say was #1 priority?
- Is THIS that priority, or am I getting distracted?
- If I'm changing priorities, have I DOCUMENTED why?

### 4. Have I Validated My Assumptions?
- Am I assuming cached data is current?
- Am I assuming tests pass for the right reasons?
- Have I run with CLEAN STATE to verify?

### 5. What's My Exit Strategy?
- If this takes >30 minutes, what will I do?
- Have I set a timer?
- Will I stop and ask for help, or keep digging?

### 6. Am I Being Honest About Technical Debt?
- Is there a TODO I'm ignoring?
- Am I adding code to work around it?
- Should I fix/remove/document instead?

---

## Red Flags That Mean STOP

🚩 **"I'll just add a quick workaround"**
→ STOP. Why not fix the root cause?

🚩 **"There's a TODO but it's not my problem"**
→ STOP. Either it IS your problem, or don't build on it.

🚩 **"The tests were passing yesterday"**
→ STOP. Clean cached state and verify.

🚩 **"This should be easy but it's taking hours"**
→ STOP. You're solving the wrong problem.

🚩 **"I'll just add more fallback logic"**
→ STOP. You're creating a ghost system.

🚩 **"The priority was X but I noticed Y"**
→ STOP. Document why you're changing priorities FIRST.

---

## The Decision Tree

```
Found a problem/bug/issue
         |
         v
    Is there a TODO comment nearby?
         |
    YES  |  NO
         |
         v
    Does it say "doesn't work"?
         |
    YES  |  NO
         |
         v
    === RED FLAG: STOP ===
         |
         v
    Ask yourself:
    1. Fix root cause? (how long?)
    2. Remove broken feature? (impact?)
    3. Document and defer? (create issue)
         |
         v
    Choose ONE, document decision
    Don't silently work around it!
```

---

## Example Application

**Scenario:** Tests are failing with "file not found"

### ❌ Bad Approach (Ghost System):
```
1. Add more file search paths
2. Try different file extensions
3. Add fallback to cached files
4. Add elaborate error handling
5. Tests pass! Ship it!
```

Result: 200 lines of workaround code, problem not solved

### ✅ Good Approach (Brutal Honesty):
```
1. WHY are files not found?
   → Emitter outputs to: tsp-test/@org/pkg/AsyncAPI.yaml
   → Tests search for: custom-name.json

2. WHY is there a mismatch?
   → Tests use "output-file" option
   → Check if option actually works...
   → Find TODO: "options not passed correctly"

3. STOP. Red flag detected!

4. Options:
   A) Fix TypeSpec API integration (estimate: unknown, could be days)
   B) Remove "output-file" option, standardize on AsyncAPI.yaml (estimate: 1 hour)
   C) Document limitation, create issue, defer (estimate: 15 minutes)

5. Choose B: Standardize

6. Result: Tests pass, simpler code, no ghost system
```

---

## Questions That Save Time

Before adding ANY code:

1. **The Simplicity Test:**
   "Could I solve this by REMOVING code instead of adding it?"

2. **The Root Cause Test:**
   "Am I fixing the cause, or the symptom of the cause?"

3. **The TODO Test:**
   "Is there a comment saying this doesn't work? Then why am I building on it?"

4. **The Cache Test:**
   "Have I verified this with clean state (no cached files)?"

5. **The Scope Test:**
   "Is this what I was asked to do, or did I get distracted?"

6. **The Time Test:**
   "It's been 30 minutes. Should I stop and ask for help?"

---

## Success Metrics

This approach is working when:

✅ You catch yourself creating ghost systems BEFORE committing them
✅ You stop and ask questions instead of silently working around TODOs
✅ You verify assumptions with clean state before debugging
✅ You focus on #1 priority instead of shiny objects
✅ You choose "remove broken feature" over "add elaborate workaround"

---

## When To Use This Prompt

- **Always:** Before starting any investigative work
- **Especially:** When you see TODO comments
- **Critical:** When "quick fix" takes >30 minutes
- **Essential:** When tests were passing, now failing
- **Mandatory:** Before adding "just one more fallback"

---

**Remember:** The goal is NOT to be perfect. The goal is to CATCH yourself before creating ghost systems. Even catching 50% of them saves MASSIVE time.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
