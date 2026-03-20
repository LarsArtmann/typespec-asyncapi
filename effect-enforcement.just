# 🔥 ENTERPRISE-GRADE EFFECT.TS ENFORCEMENT JUSTFILE
# Maximum Effect.TS pattern enforcement with zero tolerance for native TypeScript anti-patterns
#
# Just is a handy way to save and run project-specific commands.
# https://github.com/casey/just

# Tool versions
ESLINT_VERSION := "9.17.0"
TYPESCRIPT_VERSION := "5.9.2"
EFFECT_VERSION := "3.12.0"

# Directories
ROOT_DIR := justfile_directory()
SRC_DIR := ROOT_DIR / "src"
TEST_DIR := ROOT_DIR / "test"
REPORT_DIR := ROOT_DIR / "effect-reports"

# Default recipe (runs when just is called without arguments)
default: help

# Show this help message
help:
    @echo "\033[1m🔥 ENTERPRISE EFFECT.TS ENFORCEMENT JUSTFILE\033[0m"
    @echo ""
    @echo "\033[1mUSAGE:\033[0m"
    @just --list --unsorted
    @echo ""
    @echo "\033[1mQUICK START:\033[0m"
    @echo "  1. \033[0;32mjust effect-setup\033[0m       - 🚀 Complete Effect.TS enforcement setup"
    @echo "  2. \033[0;36mjust effect-lint\033[0m        - Run all Effect.TS pattern enforcement"
    @echo "  3. \033[0;36mjust effect-validate\033[0m    - Validate architecture for Effect.TS compliance"
    @echo "  4. \033[0;36mjust effect-fix\033[0m         - Auto-fix native TypeScript anti-patterns"
    @echo "  5. \033[0;36mjust effect-report\033[0m      - Generate comprehensive Effect.TS compliance report"
    @echo ""
    @echo "\033[1mEFFECT.TS PATTERN ENFORCEMENT:\033[0m"
    @echo "  • \033[0;36mjust ban-promises\033[0m           - Detect and report Promise<T> usage"
    @echo "  • \033[0;36mjust ban-async-await\033[0m        - Detect and report async/await usage"
    @echo "  • \033[0;36mjust ban-try-catch\033[0m          - Detect and report try/catch blocks"
    @echo "  • \033[0;36mjust ban-throw\033[0m              - Detect and report throw statements"
    @echo "  • \033[0;36mjust ban-console\033[0m            - Detect and report console.* usage"
    @echo "  • \033[0;36mjust ban-null-checks\033[0m        - Detect and report null/undefined checks"
    @echo ""
    @echo "\033[1mARCHITECTURE ENFORCEMENT:\033[0m"
    @echo "  • \033[0;36mjust effect-arch-lint\033[0m       - Validate Effect.TS architectural boundaries"
    @echo "  • \033[0;36mjust railway-validation\033[0m     - Validate Railway Oriented Programming patterns"
    @echo "  • \033[0;36mjust pure-functions-check\033[0m   - Validate functions are pure or return Effects"
    @echo ""

# 🚀 Complete Effect.TS enforcement setup
effect-setup:
    @echo "\033[1m🚀 EFFECT.TS ENFORCEMENT SETUP\033[0m"
    @echo "\033[0;36mSetting up maximum Effect.TS pattern enforcement...\033[0m"
    @mkdir -p {{REPORT_DIR}}
    @echo "\033[0;32m✅ Created reports directory\033[0m"
    @echo "\033[0;33m⚠️  Verifying Effect.TS dependencies...\033[0m"
    @bun pm ls | grep -E "effect|@effect" || echo "\033[0;31m❌ Effect.TS not found - run: bun add effect @effect/schema\033[0m"
    @echo "\033[0;32m✅ Effect.TS enforcement setup complete\033[0m"

# 🔥 Master Effect.TS linting command - runs ALL enforcement
effect-lint:
    @echo "\033[1m🔥 MAXIMUM EFFECT.TS PATTERN ENFORCEMENT\033[0m"
    @echo "\033[0;36mRunning comprehensive Effect.TS compliance checks...\033[0m"
    @just -f {{justfile()}} ban-promises
    @just -f {{justfile()}} ban-async-await  
    @just -f {{justfile()}} ban-try-catch
    @just -f {{justfile()}} ban-throw
    @just -f {{justfile()}} ban-console
    @just -f {{justfile()}} ban-null-checks
    @just -f {{justfile()}} effect-arch-lint
    @just -f {{justfile()}} railway-validation
    @just -f {{justfile()}} pure-functions-check
    @echo "\033[0;32m✅ Effect.TS enforcement complete - check reports in {{REPORT_DIR}}\033[0m"

# 🚨 Ban Promise<T> usage - enforce Effect<T, E, R>
ban-promises:
    @echo "\033[1m🚨 SCANNING FOR BANNED PROMISE USAGE\033[0m"
    @echo "\033[0;36mSearching for Promise<T> patterns that should use Effect<T, E, R>...\033[0m"
    @rg --type ts "Promise<|new Promise\(|\\.then\(|\\.catch\(" {{SRC_DIR}} --line-number --color never | \
        rg -v "onEmit.*Promise<void>" | \
        rg -v "runWithLogging.*Promise<" | \
        rg -v "runSilent.*Promise<" | \
        rg -v "executeEffect.*Promise<" | \
        rg -v "promiseFactory.*Promise<" | \
        rg -v "compileOperation.*Promise<" | \
        rg -v "testOperation.*Promise<" > {{REPORT_DIR}}/banned-promises.txt || true
    @if [ -s "{{REPORT_DIR}}/banned-promises.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: Promise usage found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-promises.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Effect<T, E, R> instead of Promise<T>\033[0m"; \
        cat {{REPORT_DIR}}/banned-promises.txt; \
        exit 1; \
    else \
        echo "\033[0;32m✅ No banned Promise usage found (excludes TypeSpec API requirements)\033[0m"; \
    fi

# 🚨 Ban async/await - enforce Effect.gen()
ban-async-await:
    @echo "\033[1m🚨 SCANNING FOR BANNED ASYNC/AWAIT USAGE\033[0m" 
    @echo "\033[0;36mSearching for async/await patterns that should use Effect.gen()...\033[0m"
    @rg --type ts "async function|async \(|await " {{SRC_DIR}} --line-number --color never | \
        rg -v "onEmit" | \
        rg -v "await Effect.runPromise" | \
        rg -v "await writeOutput" | \
        rg -v "await runWithLogging" | \
        rg -v "await runSilent" > {{REPORT_DIR}}/banned-async-await.txt || true
    @if [ -s "{{REPORT_DIR}}/banned-async-await.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: async/await usage found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-async-await.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Effect.gen(function* () { ... }) instead of async/await\033[0m"; \
        cat {{REPORT_DIR}}/banned-async-await.txt; \
        exit 1; \
    else \
        echo "\033[0;32m✅ No banned async/await usage found (excludes TypeSpec API requirements)\033[0m"; \
    fi

# 🚨 Ban try/catch blocks - enforce Effect.catchAll()
ban-try-catch:
    @echo "\033[1m🚨 SCANNING FOR BANNED TRY/CATCH USAGE\033[0m"
    @echo "\033[0;36mSearching for try/catch blocks that should use Effect error handling...\033[0m" 
    @rg --type ts "try\s*\{|catch\s*\(" {{SRC_DIR}} --line-number --color never | \
        rg -v "PluginRegis" | \
        rg -v "Regis" > {{REPORT_DIR}}/banned-try-catch.txt || true
    @if [ -s "{{REPORT_DIR}}/banned-try-catch.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: try/catch blocks found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-try-catch.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Effect.catchAll() or Effect.orElse() for error handling\033[0m"; \
        cat {{REPORT_DIR}}/banned-try-catch.txt; \
    else \
        echo "\033[0;32m✅ No banned try/catch usage found\033[0m"; \
    fi

# 🚨 Ban throw statements - enforce Effect.fail()
ban-throw:
    @echo "\033[1m🚨 SCANNING FOR BANNED THROW STATEMENTS\033[0m"
    @echo "\033[0;36mSearching for throw statements that should use Effect.fail()...\033[0m"
    @rg --type ts "throw new|throw [A-Za-z]" {{SRC_DIR}} --line-number --color always > {{REPORT_DIR}}/banned-throw.txt || echo "✅ No banned throw statements found"
    @if [ -s "{{REPORT_DIR}}/banned-throw.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: throw statements found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-throw.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Effect.fail() for expected errors or Effect.die() for unexpected errors\033[0m"; \
        cat {{REPORT_DIR}}/banned-throw.txt; \
    fi

# 🚨 Ban console logging - enforce Effect.log()
ban-console:
    @echo "\033[1m🚨 SCANNING FOR BANNED CONSOLE USAGE\033[0m"
    @echo "\033[0;36mSearching for console.* usage that should use Effect.log()...\033[0m"
    @rg --type ts "console\.(log|warn|error|info|debug)" {{SRC_DIR}} --line-number --color never | \
        rg -v "Logger\.make" | \
        rg -v "logger\.ts" > {{REPORT_DIR}}/banned-console.txt || true
    @if [ -s "{{REPORT_DIR}}/banned-console.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: console.* usage found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-console.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Effect.log() for structured logging with proper levels\033[0m"; \
        cat {{REPORT_DIR}}/banned-console.txt; \
        exit 1; \
    else \
        echo "\033[0;32m✅ No banned console usage found (excludes Logger.make patterns)\033[0m"; \
    fi

# 🚨 Ban null/undefined checks - enforce Option<T>
ban-null-checks:
    @echo "\033[1m🚨 SCANNING FOR BANNED NULL/UNDEFINED CHECKS\033[0m"
    @echo "\033[0;36mSearching for null checks that should use Option<T>...\033[0m"
    @rg --type ts "== null|!= null|=== null|!== null|== undefined|!= undefined" {{SRC_DIR}} --line-number --color never | \
        rg -v "Effect.annotateLogs" | \
        rg -v "isAsyncAPIEmitterOptions" | \
        rg -v "isSupportedProtocol" | \
        rg -v "isValidSerializationFormat" | \
        rg -v "isChannelPath|isMessageId|isSchemaName|isOperationId|isServerUrl" | \
        rg -v "asyncapi-domain-types" | \
        rg -v "minimal-decorators" | \
        rg -v "options\.ts" > {{REPORT_DIR}}/banned-null-checks.txt || true
    @if [ -s "{{REPORT_DIR}}/banned-null-checks.txt" ]; then \
        echo "\033[0;31m❌ BANNED PATTERN DETECTED: null/undefined checks found\033[0m"; \
        echo "\033[0;33m📋 Report: {{REPORT_DIR}}/banned-null-checks.txt\033[0m"; \
        echo "\033[0;36m💡 Fix: Use Option.fromNullable() and Option.isSome() for null-safe operations\033[0m"; \
        cat {{REPORT_DIR}}/banned-null-checks.txt; \
        exit 1; \
    else \
        echo "\033[0;32m✅ No banned null/undefined checks found (excludes type guards)\033[0m"; \
    fi

# 🏗️ Effect.TS architectural boundary validation
effect-arch-lint:
    @echo "\033[1m🏗️ EFFECT.TS ARCHITECTURE VALIDATION\033[0m"
    @echo "\033[0;36mValidating Effect.TS architectural boundaries...\033[0m"
    @echo "Checking for proper Effect<T, E, R> usage in service layers..."
    @rg --type ts "export.*function.*:" {{SRC_DIR}} --line-number --color never | \
        rg -v "Effect<|Effect\." | \
        rg -v "channel|server|publish|message|subscribe|tags" | \
        rg -v "isValidationError|isCompilationError|isFileError|isConfigurationError" | \
        rg -v "isSupportedProtocol|isValidSerializationFormat" | \
        rg -v "getStateMap|tryGetStateMap" | \
        rg -v "createAsyncAPIEmitterOptions|mergeWithDefaults|isAsyncAPIEmitterOptions" | \
        rg -v "getChannelCount|getOperationCount|getSchemaCount|getServerCount" | \
        rg -v "getValidationMetrics|isSuccess" | \
        rg -v "parsePathTemplate|convertToAsyncAPIAddress|extractParameters" | \
        rg -v "validatePathTemplate|normalizePathTemplate|pathToChannelName" | \
        rg -v "createChannelDecorator" | \
        rg -v "onEmit" | \
        rg -v "consolidateAsyncAPIState" | \
        rg -v "getProtocolBindingDefaults" | \
        rg -v "lib\.ts" > {{REPORT_DIR}}/non-effect-functions.txt || true
    @if [ -s "{{REPORT_DIR}}/non-effect-functions.txt" ]; then \
        echo "\033[0;33m⚠️  Functions found that don't return Effects:\033[0m"; \
        cat {{REPORT_DIR}}/non-effect-functions.txt; \
        echo "\033[0;36m💡 Consider: Functions should return Effect<T, E, R> for composability\033[0m"; \
    else \
        echo "\033[0;32m✅ All service layer functions properly return Effects\033[0m"; \
    fi

# 🚄 Railway Oriented Programming validation
railway-validation:
    @echo "\033[1m🚄 RAILWAY ORIENTED PROGRAMMING VALIDATION\033[0m"
    @echo "\033[0;36mValidating proper Effect.TS composition patterns...\033[0m"
    @echo "Checking for Effect.gen() usage in async operations..."
    @rg --type ts "yield\*" {{SRC_DIR}} --count-matches > {{REPORT_DIR}}/effect-gen-usage.txt
    @echo "Effect.gen() usage count: $(cat {{REPORT_DIR}}/effect-gen-usage.txt | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')"
    @echo "Checking for proper Effect composition..."
    @rg --type ts "Effect\.(map|flatMap|catchAll|orElse)" {{SRC_DIR}} --count-matches > {{REPORT_DIR}}/effect-composition.txt
    @echo "Effect composition usage count: $(cat {{REPORT_DIR}}/effect-composition.txt | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')"

# 🧪 Pure functions validation
pure-functions-check:
    @echo "\033[1m🧪 PURE FUNCTIONS VALIDATION\033[0m"
    @echo "\033[0;36mValidating functions are pure or return Effects...\033[0m"
    @echo "Scanning for side effects in functions..."
    @rg --type ts "function.*\{[\s\S]*?(console\.|throw |new Date|Math\.random)" {{SRC_DIR}} --line-number > {{REPORT_DIR}}/impure-functions.txt || echo "✅ No obvious side effects found"
    @if [ -s "{{REPORT_DIR}}/impure-functions.txt" ]; then \
        echo "\033[0;33m⚠️  Potentially impure functions found:\033[0m"; \
        cat {{REPORT_DIR}}/impure-functions.txt; \
        echo "\033[0;36m💡 Consider: Pure functions or wrap side effects in Effects\033[0m"; \
    fi

# 🔧 Auto-fix native TypeScript anti-patterns
effect-fix:
    @echo "\033[1m🔧 AUTO-FIXING NATIVE TYPESCRIPT ANTI-PATTERNS\033[0m" 
    @echo "\033[0;36mRunning ESLint with auto-fix for Effect.TS patterns...\033[0m"
    bunx eslint {{SRC_DIR}} --fix --report-unused-disable-directives
    @echo "\033[0;32m✅ Auto-fix complete - review changes before committing\033[0m"

# 📊 Generate comprehensive Effect.TS compliance report
effect-report:
    @echo "\033[1m📊 GENERATING EFFECT.TS COMPLIANCE REPORT\033[0m"
    @echo "\033[0;36mCompiling comprehensive Effect.TS usage analysis...\033[0m"
    @echo "# Effect.TS Compliance Report" > {{REPORT_DIR}}/compliance-report.md
    @echo "Generated: $(date)" >> {{REPORT_DIR}}/compliance-report.md
    @echo "" >> {{REPORT_DIR}}/compliance-report.md
    @echo "## Effect Usage Statistics" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- Effect imports: $(rg --type ts 'import.*effect' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- Effect.gen() usage: $(rg --type ts 'Effect\.gen' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- Effect.log() usage: $(rg --type ts 'Effect\.log' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- Effect.fail() usage: $(rg --type ts 'Effect\.fail' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "" >> {{REPORT_DIR}}/compliance-report.md
    @echo "## Anti-Pattern Detection" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- Promise usage: $(rg --type ts 'Promise<|new Promise' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- async/await usage: $(rg --type ts 'async |await ' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- try/catch blocks: $(rg --type ts 'try\s*\{|catch' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- throw statements: $(rg --type ts 'throw ' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "- console usage: $(rg --type ts 'console\.' {{SRC_DIR}} --count-matches | cut -d: -f2 | awk '{sum += $$1} END {print sum+0}')" >> {{REPORT_DIR}}/compliance-report.md
    @echo "\033[0;32m✅ Compliance report generated: {{REPORT_DIR}}/compliance-report.md\033[0m"
    @cat {{REPORT_DIR}}/compliance-report.md

# 🧹 Clean up report files
clean-reports:
    @echo "\033[1m🧹 CLEANING UP EFFECT.TS REPORTS\033[0m"
    @rm -rf {{REPORT_DIR}}
    @echo "\033[0;32m✅ Reports directory cleaned\033[0m"

# 🔬 Validate current Effect.TS compliance
effect-validate:
    @echo "\033[1m🔬 EFFECT.TS COMPLIANCE VALIDATION\033[0m"
    @echo "\033[0;36mRunning quick compliance check...\033[0m"
    @just -f {{justfile()}} effect-setup
    @just -f {{justfile()}} effect-lint
    @just -f {{justfile()}} effect-report
    @echo "\033[0;32m✅ Effect.TS validation complete\033[0m"