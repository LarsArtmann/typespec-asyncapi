# Report about missing/under-specified/confusing information

Date: 2025-10-07T04:47:00+00:00

I was asked to perform:

- Fix test regression (583 → 581 passing tests)
- Investigate why "correct" await fixes caused tests to fail
- Batch-fix test output paths
- Implement missing AsyncAPI features
- Complete comprehensive planning and documentation

I was given these context information's:

- Session summary from 2025-10-06 indicating "batch-fix test paths = #1 priority"
- Test suite showing 583 passing tests (from yesterday)
- Information about AssetEmitter fixes from previous session
- GitHub issues and project state

I was missing these information:

1. **Critical Missing Info:** Test infrastructure has KNOWN BUGS that were never documented
   - Line 120 comment says "options still not passed correctly" but no details
   - Line 125 says "TODO: Options passing still not working" but no root cause analysis
   - This ghost system was hiding in plain sight!

2. **TypeSpec API Documentation:** How to properly pass emitter options in tests
   - createTestWrapper API doesn't support `emitters:` parameter
   - No documentation on correct way to configure emitter options in test infrastructure
   - Had to reverse-engineer from type definitions

3. **Test Output Path Expectations:** Where files are ACTUALLY generated vs where tests EXPECT them
   - Emitter generates: `tsp-test/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml`
   - Tests store as: `AsyncAPI.yaml` (just filename)
   - Tests search for: paths containing `@lars-artmann/typespec-asyncapi`
   - This mismatch was never explained!

4. **Case Sensitivity Issue:** Files stored with capital 'A' but searched lowercase
   - Files: "AsyncAPI.yaml"
   - Search: `path.includes('asyncapi')` (lowercase)
   - No match! This should have been caught in code review.

5. **Test Caching Problem:** tsp-test directory is never cleaned
   - Tests rely on cached files from previous runs
   - Test results CHANGE based on what's cached
   - No documentation about this critical issue

I was confused by:

1. **The "await fixes" regression:** How can adding correct `await` keywords make tests WORSE?
   - Answer: Tests were accidentally passing with wrong Promise types
   - Now they get correct objects but hit different bugs (missing files)

2. **The "583 → 581" regression:** Why did tests go DOWN?
   - Answer: The "583" was inflated by cached files
   - Real baseline: 575 tests passing
   - Cached files were hiding the real failure rate!

3. **"output-file" option:** Why do tests specify custom filenames if they don't work?
   - Answer: This is a ghost system - the option is ignored
   - Tests were written assuming it worked
   - Nobody ever verified it!

4. **Why yesterday's summary said "batch-fix paths = highest priority":** If that was the blocker, why didn't I start there?
   - Answer: I got distracted by "missing await" keywords
   - Should have validated the assumption first
   - Scope creep trap!

What I wish for the future is:

1. **Document KNOWN BUGS prominently** - Don't hide TODOs in comments
   - Create GitHub issues for "options not passed correctly"
   - Add README warning about test infrastructure limitations
   - Make the pain visible!

2. **Test Infrastructure Health Checks:**
   - Pre-test cleanup: `rm -rf tsp-test tsp-output test-output`
   - Post-test validation: Check that files were actually generated
   - Fail-fast on ghost systems

3. **Better Initial Context:**
   - "Yesterday's summary said X is highest priority"
   - "But first, verify X is still the blocker"
   - "Run diagnostic tests before diving into fixes"

4. **Architectural Decision Records (ADRs):**
   - Why do we have elaborate file-finding logic? (Answer: Ghost system)
   - Why don't emitter options work? (Answer: TypeSpec API limitation)
   - Document these decisions!

5. **Honest Assessment:**
   - If something "doesn't work", say so clearly
   - Don't write elaborate fallback logic to work around broken systems
   - Fix the root cause OR remove the feature

6. **Test Isolation:**
   - Each test should clean up after itself
   - Tests should NOT depend on execution order
   - Tests should NOT share output directories

Best regards,
Claude Code Assistant
